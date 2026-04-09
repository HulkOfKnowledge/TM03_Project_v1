"""
Stochastic Planner Service
- Markov Chain for spending category probability
- MDP-style card selection for merchant-level decisions
"""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from datetime import datetime, timedelta
import os
from typing import Any, Dict, List, Optional, Tuple

import httpx
from dotenv import load_dotenv
from app.core.config import settings

from app.models.schemas import (
    SpendingProbabilityRequest,
    SpendingProbabilityResponse,
    CategoryProbability,
    CardChoiceRequest,
    CardChoiceResponse,
    NewCardOpportunitiesRequest,
    NewCardOpportunitiesResponse,
    CardActionValue,
    CardChoiceCounterfactual,
    OwnedCardOpportunity,
    UpgradeOpportunity,
    ForecastInsightsRequest,
    ForecastInsightsResponse,
    ForecastCategoryTotal,
    ForecastAnomaly,
    ForecastMonthlyPoint,
    ForecastSnapshot,
    ForecastCategoryMomentum,
    ForecastNextSpendPrediction,
    ForecastNextSpendProbability,
)
from app.services.category_taxonomy import SHARED_CATEGORIES, infer_shared_category


@dataclass
class _Txn:
    card_id: str
    date: datetime
    amount: float
    category: str
    description: str
    balance: Optional[float]


class NoRewardDataError(Exception):
    """Raised when reward rates are unavailable for all candidate cards."""

    def __init__(
        self,
        message: str,
        skipped_cards: Optional[List[str]] = None,
        code: str = "NO_REWARD_DATA",
    ):
        super().__init__(message)
        self.skipped_cards = skipped_cards or []
        self.code = code


class InsufficientDataError(Exception):
    """Raised when deterministic computation cannot proceed due to missing empirical data."""

    def __init__(self, message: str, code: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message)
        self.code = code
        self.details = details or {}


class StochasticPlanner:
    """Hybrid stochastic engine for category and card decisions."""

    def __init__(self):
        self._reward_catalog_cache: Optional[List[Dict[str, Any]]] = None
        self._env_loaded: bool = False

    def invalidate_reward_catalog_cache(self) -> None:
        self._reward_catalog_cache = None

    def predict_spending_probability(
        self,
        request: SpendingProbabilityRequest,
    ) -> SpendingProbabilityResponse:
        category_space = self._derive_category_space(request.transactions)
        transactions = self._filter_and_normalize_transactions(
            transactions=request.transactions,
            lookback_days=request.lookback_days,
        )

        if len(transactions) < 2:
            raise InsufficientDataError(
                "At least two in-window transactions are required to compute transition probabilities.",
                code="INSUFFICIENT_SPENDING_HISTORY",
                details={"required_transactions": 2, "observed_transactions": len(transactions)},
            )

        transitions = self._build_category_transition_counts(transactions, category_space)
        current_category = self._normalize_category(request.current_category) if request.current_category else transactions[-1].category
        current_category = current_category if current_category in category_space else "other"

        row = transitions[current_category]
        row_total = sum(row.values())
        if row_total <= 0:
            raise InsufficientDataError(
                "No observed outgoing transitions for the selected current category.",
                code="INSUFFICIENT_CATEGORY_TRANSITIONS",
                details={"current_category": current_category},
            )

        probs = []
        for cat in category_space:
            p = row.get(cat, 0) / row_total
            probs.append(CategoryProbability(category=cat, probability=round(p, 6)))

        probs.sort(key=lambda x: x.probability, reverse=True)
        top_category = probs[0].category if probs else "other"

        return SpendingProbabilityResponse(
            user_id=request.user_id,
            current_category=current_category,
            probabilities=probs,
            top_category=top_category,
            transition_counts={
                src: {dst: int(counts.get(dst, 0)) for dst in category_space}
                for src, counts in transitions.items()
            },
            computed_at=datetime.utcnow().isoformat(),
        )

    def choose_card_for_merchant(
        self,
        request: CardChoiceRequest,
    ) -> CardChoiceResponse:
        if not request.cards:
            raise NoRewardDataError("No benefit to card yet", [])

        offers = self._load_reward_catalog()
        resolved_reward_maps, skipped_card_ids = self._resolve_reward_maps(request.cards, offers)
        eligible_cards = []
        for card in request.cards:
            reward_map = resolved_reward_maps.get(card.card_id)
            if not reward_map:
                continue
            card.estimated_reward_rate_by_category = reward_map
            eligible_cards.append(card)

        if not eligible_cards:
            raise NoRewardDataError("No benefit to card yet", skipped_card_ids)

        merchant_category = self._normalize_category(request.merchant_category or request.merchant_name)

        txns = self._filter_and_normalize_transactions(
            transactions=request.transactions,
            lookback_days=request.lookback_days,
        )
        if len(txns) < 2:
            raise InsufficientDataError(
                "At least two in-window transactions are required for card-choice transition modeling.",
                code="INSUFFICIENT_TRANSACTION_HISTORY",
                details={"required_transactions": 2, "observed_transactions": len(txns)},
            )

        card_limits = {card.card_id: card.credit_limit for card in eligible_cards}
        transition_by_card = self._build_card_bucket_transitions(
            transactions=txns,
            card_limits=card_limits,
        )

        gamma = 0.9
        action_values: List[CardActionValue] = []

        for card in eligible_cards:
            transitions = transition_by_card.get(card.card_id)
            if not transitions:
                continue
            state_bucket = self._bucket_for_utilization(card.utilization_percentage)
            state_row = transitions.get(state_bucket)
            if not state_row:
                continue

            immediate = self._state_reward(
                card=card,
                util_bucket=state_bucket,
                merchant_category=merchant_category,
                estimated_amount=request.estimated_amount,
            )
            expected_next = sum(
                state_row[dst] * self._state_reward(
                    card=card,
                    util_bucket=dst,
                    merchant_category=merchant_category,
                    estimated_amount=request.estimated_amount,
                )
                for dst in ("low", "medium", "high")
            )

            post_util = min(
                100.0,
                max(
                    0.0,
                    ((card.current_balance + request.estimated_amount) / card.credit_limit) * 100,
                ),
            )

            q_value = immediate + gamma * expected_next

            action_values.append(
                CardActionValue(
                    card_id=card.card_id,
                    q_value=round(q_value, 6),
                    immediate_reward=round(immediate, 6),
                    expected_next_value=round(expected_next, 6),
                    estimated_post_utilization=round(post_util, 2),
                )
            )

        if not action_values:
            raise InsufficientDataError(
                "No utilization transition history was available for candidate cards.",
                code="INSUFFICIENT_TRANSITION_HISTORY",
            )

        action_values.sort(key=lambda a: a.q_value, reverse=True)
        recommended = action_values[0].card_id if action_values else eligible_cards[0].card_id

        inferred_baseline_card_id, estimated_monthly_spend = self._infer_baseline_and_monthly_spend(
            txns=txns,
            merchant_category=merchant_category,
            lookback_days=request.lookback_days,
        )

        explicit_used_card = request.used_card_id
        card_ids = {card.card_id for card in eligible_cards}
        baseline_card_id = explicit_used_card if explicit_used_card in card_ids else inferred_baseline_card_id

        baseline_card = next((card for card in eligible_cards if card.card_id == baseline_card_id), None)
        recommended_card = next((card for card in eligible_cards if card.card_id == recommended), None)

        baseline_rate = self._estimate_reward_rate(
            baseline_card or eligible_cards[0],
            merchant_category,
        )
        recommended_rate = self._estimate_reward_rate(
            recommended_card or eligible_cards[0],
            merchant_category,
        )

        baseline_reward = request.estimated_amount * baseline_rate
        recommended_reward = request.estimated_amount * recommended_rate
        incremental_reward = max(0.0, recommended_reward - baseline_reward)

        upgrade_opportunities = self._build_upgrade_opportunities(
            txns=txns,
            cards=eligible_cards,
            offers=offers,
            lookback_days=request.lookback_days,
        )
        upgrade_opportunity = upgrade_opportunities[0] if upgrade_opportunities else None

        min_incremental = max(0.0, float(settings.MIN_INCREMENTAL_REWARD_DOLLARS))
        if incremental_reward < min_incremental and not upgrade_opportunities:
            raise NoRewardDataError(
                f"No benefit to card yet (below ${min_incremental:.2f} minimum)",
                [card.card_id for card in eligible_cards],
                code="LOW_INCREMENTAL_REWARD",
            )

        monthly_incremental = max(0.0, estimated_monthly_spend * (recommended_rate - baseline_rate))
        annual_incremental = monthly_incremental * 12

        counterfactual = CardChoiceCounterfactual(
            baseline_card_id=baseline_card_id,
            recommended_card_id=recommended,
            estimated_reward_baseline=round(baseline_reward, 4),
            estimated_reward_recommended=round(recommended_reward, 4),
            estimated_incremental_reward=round(incremental_reward, 4),
            estimated_monthly_incremental_reward=round(monthly_incremental, 4),
            estimated_annual_incremental_reward=round(annual_incremental, 4),
        )

        owned_card_opportunity = None
        if baseline_card_id and recommended != baseline_card_id and incremental_reward > 0:
            owned_card_opportunity = OwnedCardOpportunity(
                used_card_id=baseline_card_id,
                recommended_card_id=recommended,
                estimated_incremental_reward=round(incremental_reward, 4),
                estimated_monthly_incremental_reward=round(monthly_incremental, 4),
                estimated_annual_incremental_reward=round(annual_incremental, 4),
                message={
                    "en": (
                        f"For this {request.merchant_name} transaction, use card {recommended} instead of card "
                        f"{baseline_card_id} to earn about ${incremental_reward:.2f} more in rewards."
                    ),
                    "fr": (
                        f"Pour cette transaction chez {request.merchant_name}, utilisez la carte {recommended} "
                        f"au lieu de {baseline_card_id} pour gagner environ {incremental_reward:.2f}$ de plus en recompenses."
                    ),
                    "ar": (
                        f"لهذه المعاملة لدى {request.merchant_name}، استخدم البطاقة {recommended} بدلا من "
                        f"{baseline_card_id} للحصول على مكافآت إضافية تقارب ${incremental_reward:.2f}."
                    ),
                },
            )

        reason = {
            "en": (
                f"Recommended card {recommended} for {request.merchant_name} ({merchant_category}) "
                "using an MDP objective that balances reward earning, utilization risk, due-date pressure, "
                "and expected future state value."
            ),
            "fr": (
                f"Carte recommandee {recommended} pour {request.merchant_name} ({merchant_category}) "
                "avec un objectif MDP equilibrant recompenses, risque d'utilisation, urgence d'echeance "
                "et valeur future attendue."
            ),
            "ar": (
                f"البطاقة الموصى بها {recommended} لدى {request.merchant_name} ({merchant_category}) "
                "باستخدام هدف قرار MDP يوازن بين المكافآت ومخاطر الاستخدام وضغط تاريخ الاستحقاق والقيمة المستقبلية."
            ),
        }

        if upgrade_opportunity:
            spend_share = upgrade_opportunity.spend_share_percentage or 0.0
            top_category = upgrade_opportunity.top_spend_category
            best_offer_name = upgrade_opportunity.suggested_offer_name or "a better rewards card"
            monthly_gain = upgrade_opportunity.estimated_monthly_incremental_reward or 0.0
            annual_gain = upgrade_opportunity.estimated_annual_incremental_reward or 0.0
            reason["en"] += (
                f" You currently spend about {spend_share:.1f}% of tracked spend in {top_category}. "
                f"A card like {best_offer_name} could add about ${monthly_gain:.2f}/month "
                f"(${annual_gain:.2f}/year) in rewards based on your current spending mix."
            )

        return CardChoiceResponse(
            user_id=request.user_id,
            merchant_name=request.merchant_name,
            merchant_category=merchant_category,
            recommended_card_id=recommended,
            policy_reasoning=reason,
            action_values=action_values,
            counterfactual=counterfactual,
            owned_card_opportunity=owned_card_opportunity,
            upgrade_opportunity=upgrade_opportunity,
            new_card_opportunities=upgrade_opportunities,
            upgrade_opportunities=upgrade_opportunities,
            computed_at=datetime.utcnow().isoformat(),
        )

    def recommend_new_card_opportunities(
        self,
        request: NewCardOpportunitiesRequest,
    ) -> NewCardOpportunitiesResponse:
        """Scenario 2 only: suggest external cards based on concentrated category spending."""
        if not request.cards:
            return NewCardOpportunitiesResponse(
                user_id=request.user_id,
                opportunities=[],
                computed_at=datetime.utcnow().isoformat(),
            )

        offers = self._load_reward_catalog()
        resolved_reward_maps, _ = self._resolve_reward_maps(request.cards, offers)
        eligible_cards = []
        for card in request.cards:
            reward_map = resolved_reward_maps.get(card.card_id)
            if not reward_map:
                continue
            card.estimated_reward_rate_by_category = reward_map
            eligible_cards.append(card)

        if not eligible_cards:
            return NewCardOpportunitiesResponse(
                user_id=request.user_id,
                opportunities=[],
                computed_at=datetime.utcnow().isoformat(),
            )

        txns = self._filter_and_normalize_transactions(
            transactions=request.transactions,
            lookback_days=request.lookback_days,
        )

        opportunities = self._build_upgrade_opportunities(
            txns=txns,
            cards=eligible_cards,
            offers=offers,
            lookback_days=request.lookback_days,
        )

        return NewCardOpportunitiesResponse(
            user_id=request.user_id,
            opportunities=opportunities,
            computed_at=datetime.utcnow().isoformat(),
        )

    def build_forecast_insights(
        self,
        request: ForecastInsightsRequest,
    ) -> ForecastInsightsResponse:
        txns = self._filter_and_normalize_transactions(
            transactions=request.transactions,
            lookback_days=730,
        )

        start_date = request.start_date[:10]
        end_date = request.end_date[:10]
        today_iso = (request.current_date or datetime.utcnow().strftime("%Y-%m-%d"))[:10]

        filtered = [t for t in txns if start_date <= t.date.strftime("%Y-%m-%d") <= end_date and t.amount > 0]

        range_totals: Dict[str, float] = defaultdict(float)
        for txn in filtered:
            range_totals[txn.category] += txn.amount

        top_categories = sorted(
            [ForecastCategoryTotal(category=cat, amount=round(amount, 2)) for cat, amount in range_totals.items()],
            key=lambda item: item.amount,
            reverse=True,
        )[:5]

        monthly_totals: Dict[str, float] = defaultdict(float)
        for txn in filtered:
            ym = txn.date.strftime("%Y-%m")
            monthly_totals[ym] += txn.amount

        monthly_trend = [
            ForecastMonthlyPoint(month=ym, total=round(total, 2))
            for ym, total in sorted(monthly_totals.items(), key=lambda item: item[0])[-8:]
        ]

        category_momentum: List[ForecastCategoryMomentum] = []
        try:
            start_dt = datetime.strptime(start_date, "%Y-%m-%d")
            end_dt = datetime.strptime(end_date, "%Y-%m-%d")
            today_dt = datetime.strptime(today_iso, "%Y-%m-%d")

            # For the default current month-to-date view, compare against the same
            # day span in the previous month (e.g., Apr 1-8 vs Mar 1-8).
            is_current_mtd = (
                start_dt.year == today_dt.year
                and start_dt.month == today_dt.month
                and start_dt.day == 1
                and end_dt.date() == today_dt.date()
            )

            if is_current_mtd:
                if today_dt.month == 1:
                    prev_year = today_dt.year - 1
                    prev_month = 12
                else:
                    prev_year = today_dt.year
                    prev_month = today_dt.month - 1

                prev_month_days = self._days_in_month(prev_year, prev_month)
                prev_day = min(today_dt.day, prev_month_days)
                prev_start_dt = datetime(prev_year, prev_month, 1)
                prev_end_dt = datetime(prev_year, prev_month, prev_day)
            else:
                period_days = max((end_dt - start_dt).days + 1, 1)
                prev_end_dt = start_dt - timedelta(days=1)
                prev_start_dt = prev_end_dt - timedelta(days=period_days - 1)

            prev_totals: Dict[str, float] = defaultdict(float)
            for txn in txns:
                if txn.amount <= 0:
                    continue
                d = txn.date
                if prev_start_dt <= d <= prev_end_dt:
                    prev_totals[txn.category] += txn.amount

            for item in top_categories:
                current_amount = float(item.amount)
                previous_amount = float(round(prev_totals.get(item.category, 0.0), 2))
                if previous_amount > 0:
                    change_pct = ((current_amount - previous_amount) / previous_amount) * 100
                elif current_amount > 0:
                    change_pct = 100.0
                else:
                    change_pct = 0.0

                direction = "Stable"
                if change_pct >= 15:
                    direction = "Rising"
                elif change_pct <= -15:
                    direction = "Cooling"

                category_momentum.append(
                    ForecastCategoryMomentum(
                        category=item.category,
                        current_amount=round(current_amount, 2),
                        previous_amount=round(previous_amount, 2),
                        change_pct=round(change_pct, 1),
                        direction=direction,
                    )
                )
        except Exception:
            category_momentum = []

        anomaly = None
        forecast_snapshot = None
        next_spend_prediction = None

        try:
            now = datetime.strptime(today_iso, "%Y-%m-%d")
            month_iso = now.strftime("%Y-%m")
            month_start_iso = f"{month_iso}-01"
            month_days = self._days_in_month(now.year, now.month)
            day_of_month = now.day
            is_mtd = start_date == month_start_iso and end_date == today_iso

            if is_mtd:
                this_month_totals: Dict[str, float] = defaultdict(float)
                per_month_category_totals: Dict[str, Dict[str, float]] = defaultdict(lambda: defaultdict(float))
                per_month_spend_totals: Dict[str, float] = defaultdict(float)

                for txn in txns:
                    if txn.amount <= 0:
                        continue
                    d = txn.date.strftime("%Y-%m-%d")
                    ym = txn.date.strftime("%Y-%m")
                    per_month_category_totals[ym][txn.category] += txn.amount
                    per_month_spend_totals[ym] += txn.amount
                    if month_start_iso <= d <= today_iso:
                        this_month_totals[txn.category] += txn.amount

                full_past_months = sorted([ym for ym in per_month_category_totals.keys() if ym < month_iso])[-6:]

                best_anomaly = None
                if len(full_past_months) >= 2:
                    for category, month_to_date in this_month_totals.items():
                        past_values = [per_month_category_totals[ym].get(category, 0.0) for ym in full_past_months]
                        average_monthly = sum(past_values) / len(full_past_months)
                        if average_monthly <= 0:
                            continue

                        pct_of_month = day_of_month / max(month_days, 1)
                        pace_projection = month_to_date / max(pct_of_month, 0.1)
                        is_over = month_to_date > average_monthly or pace_projection > average_monthly * 1.1
                        if not is_over:
                            continue

                        delta = month_to_date - average_monthly
                        if not best_anomaly or delta > (best_anomaly["month_to_date"] - best_anomaly["average_monthly"]):
                            best_anomaly = {
                                "category": category,
                                "average_monthly": round(average_monthly, 2),
                                "month_to_date": round(month_to_date, 2),
                                "day_of_month": day_of_month,
                                "baseline_months": full_past_months,
                            }

                if best_anomaly:
                    anomaly = ForecastAnomaly(**best_anomaly)

                mtd_spend = sum(this_month_totals.values())
                if mtd_spend > 0:
                    elapsed_pct = day_of_month / max(month_days, 1)
                    projected_month_end = mtd_spend / max(elapsed_pct, 0.1)

                    txn_count = len([t for t in txns if month_start_iso <= t.date.strftime("%Y-%m-%d") <= today_iso and t.amount > 0])
                    confidence = "High" if txn_count >= 25 else "Medium" if txn_count >= 12 else "Low"
                    volatility = 0.08 if confidence == "High" else 0.13 if confidence == "Medium" else 0.2
                    projected_low = projected_month_end * (1 - volatility)
                    projected_high = projected_month_end * (1 + volatility)

                    prior_months = sorted([ym for ym in per_month_spend_totals.keys() if ym < month_iso])[-3:]
                    prior_avg = sum(per_month_spend_totals[ym] for ym in prior_months) / len(prior_months) if prior_months else 0
                    status = "On Track"
                    if prior_avg > 0 and projected_month_end > prior_avg * 1.35:
                        status = "Risk"
                    elif prior_avg > 0 and projected_month_end > prior_avg * 1.15:
                        status = "Watch"

                    forecast_snapshot = ForecastSnapshot(
                        mtd_spend=round(mtd_spend, 2),
                        projected_month_end=round(projected_month_end, 2),
                        projected_low=round(projected_low, 2),
                        projected_high=round(projected_high, 2),
                        confidence=confidence,
                        status=status,
                        day_of_month=day_of_month,
                        month_days=month_days,
                    )
        except Exception:
            # Keep endpoint resilient; return partial insights if date parsing fails.
            pass

        try:
            if end_date >= today_iso and len(filtered) >= 2:
                current_category = top_categories[0].category if top_categories else None
                spend_prob = self.predict_spending_probability(
                    SpendingProbabilityRequest(
                        user_id=request.user_id,
                        transactions=request.transactions,
                        current_category=current_category,
                        lookback_days=180,
                    )
                )

                next_spend_prediction = ForecastNextSpendPrediction(
                    current_category=spend_prob.current_category,
                    top_category=spend_prob.top_category,
                    probabilities=[
                        ForecastNextSpendProbability(category=item.category, probability=item.probability)
                        for item in spend_prob.probabilities[:6]
                    ],
                )
        except InsufficientDataError:
            next_spend_prediction = None
        except Exception:
            next_spend_prediction = None

        return ForecastInsightsResponse(
            user_id=request.user_id,
            start_date=start_date,
            end_date=end_date,
            top_categories=top_categories,
            anomaly=anomaly,
            category_momentum=category_momentum,
            monthly_trend=monthly_trend,
            forecast_snapshot=forecast_snapshot,
            next_spend_prediction=next_spend_prediction,
            computed_at=datetime.utcnow().isoformat(),
        )

    def _days_in_month(self, year: int, month: int) -> int:
        if month == 12:
            next_month = datetime(year + 1, 1, 1)
        else:
            next_month = datetime(year, month + 1, 1)
        current_month = datetime(year, month, 1)
        return (next_month - current_month).days

    def _derive_category_space(self, transactions) -> List[str]:
        """
        Build a stable but flexible category universe for Markov outputs.
        Starts with shared taxonomy and adds frequent provider categories.
        """
        categories = set(SHARED_CATEGORIES)
        observed_counts: Dict[str, int] = defaultdict(int)

        for txn in transactions or []:
            category = self._normalize_category(getattr(txn, "category", None))
            if category:
                observed_counts[category] += 1

        # Include custom provider categories when they appear repeatedly.
        for category, count in observed_counts.items():
            if category not in categories and count >= 2:
                categories.add(category)

        ordered = sorted(categories)
        if "other" in ordered:
            ordered.remove("other")
            ordered.append("other")

        return ordered

    def _infer_baseline_and_monthly_spend(
        self,
        txns: List[_Txn],
        merchant_category: str,
        lookback_days: int,
    ) -> Tuple[Optional[str], float]:
        if not txns:
            return None, 0.0

        filtered = [t for t in txns if t.category == merchant_category and t.amount > 0]
        if not filtered:
            return None, 0.0

        spend_by_card: Dict[str, float] = defaultdict(float)
        for txn in filtered:
            spend_by_card[txn.card_id] += txn.amount

        baseline_card_id = max(spend_by_card.items(), key=lambda x: x[1])[0]
        category_total = sum(spend_by_card.values())

        lookback_days = max(30, lookback_days)
        monthly_spend = category_total * (30.0 / float(lookback_days))

        return baseline_card_id, round(monthly_spend, 2)

    def _filter_and_normalize_transactions(self, transactions, lookback_days: int) -> List[_Txn]:
        cutoff = datetime.utcnow() - timedelta(days=lookback_days)
        parsed: List[_Txn] = []

        for txn in transactions:
            date = self._safe_parse_date(txn.date)
            if date is None or date < cutoff:
                continue

            category = infer_shared_category(
                raw_category=txn.category,
                description=txn.description,
                merchant_name=txn.merchant_name,
            )

            parsed.append(
                _Txn(
                    card_id=txn.card_id,
                    date=date,
                    amount=txn.amount,
                    category=category,
                    description=txn.description or "",
                    balance=txn.balance,
                )
            )

        parsed.sort(key=lambda t: t.date)
        return parsed

    def _build_category_transition_counts(
        self,
        transactions: List[_Txn],
        category_space: List[str],
    ) -> Dict[str, Dict[str, int]]:
        transitions = {src: {dst: 0 for dst in category_space} for src in category_space}

        if len(transactions) < 2:
            return transitions

        for prev_txn, next_txn in zip(transactions[:-1], transactions[1:]):
            src = prev_txn.category if prev_txn.category in category_space else "other"
            dst = next_txn.category if next_txn.category in category_space else "other"
            transitions[src][dst] += 1

        return transitions

    def _build_card_bucket_transitions(
        self,
        transactions: List[_Txn],
        card_limits: Dict[str, float],
    ) -> Dict[str, Dict[str, Dict[str, float]]]:
        grouped: Dict[str, List[_Txn]] = defaultdict(list)
        for txn in transactions:
            if txn.card_id in card_limits:
                grouped[txn.card_id].append(txn)

        matrices = {}
        for card_id, txns in grouped.items():
            txns.sort(key=lambda t: t.date)
            counts = {s: {d: 0 for d in ("low", "medium", "high")} for s in ("low", "medium", "high")}
            card_limit = card_limits.get(card_id, 0)
            if card_limit <= 0:
                continue

            for current_txn, next_txn in zip(txns[:-1], txns[1:]):
                current_util = self._utilization_from_txn(current_txn, card_limit)
                next_util = self._utilization_from_txn(next_txn, card_limit)
                if current_util is None or next_util is None:
                    continue
                src = self._bucket_for_utilization(current_util)
                dst = self._bucket_for_utilization(next_util)
                counts[src][dst] += 1

            normalized = self._normalize_bucket_counts(counts)
            if normalized:
                matrices[card_id] = normalized

        return matrices

    def _normalize_bucket_counts(self, counts: Dict[str, Dict[str, int]]) -> Dict[str, Dict[str, float]]:
        normalized: Dict[str, Dict[str, float]] = {}
        for src in ("low", "medium", "high"):
            row = counts[src]
            total = sum(row.values())
            if total <= 0:
                continue
            normalized[src] = {
                dst: row.get(dst, 0) / total
                for dst in ("low", "medium", "high")
            }
        return normalized

    def _state_reward(self, card, util_bucket: str, merchant_category: str, estimated_amount: float) -> float:
        reward_rate = self._estimate_reward_rate(card, merchant_category)
        reward_gain = estimated_amount * reward_rate

        util_midpoint = {"low": 20.0, "medium": 50.0, "high": 85.0}[util_bucket]
        post_util = min(100.0, util_midpoint + (estimated_amount / max(card.credit_limit, 1.0)) * 100)

        apr = card.interest_rate if card.interest_rate is not None else 0.0
        interest_penalty = (apr / 100.0) * estimated_amount * 0.08

        util_penalty = 0.0
        if post_util > 30:
            util_penalty += ((post_util - 30) / 70) * 2.5
        if post_util > 70:
            util_penalty += 2.0

        due_penalty = 0.0
        days_to_due = self._days_until_due(card.payment_due_date)
        if days_to_due is not None and 0 <= days_to_due <= 3:
            due_penalty = 1.5
        elif days_to_due is not None and 4 <= days_to_due <= 7:
            due_penalty = 0.5

        return reward_gain - interest_penalty - util_penalty - due_penalty

    def _estimate_reward_rate(self, card, merchant_category: str) -> float:
        if card.estimated_reward_rate_by_category:
            exact = card.estimated_reward_rate_by_category.get(merchant_category)
            if exact is not None:
                return max(0.0, min(float(exact), 0.2))
            default = card.estimated_reward_rate_by_category.get("default")
            if default is not None:
                return max(0.0, min(float(default), 0.2))
        return 0.0

    def _resolve_reward_maps(
        self,
        cards,
        offers: Optional[List[Dict[str, Any]]] = None,
    ) -> Tuple[Dict[str, Dict[str, float]], List[str]]:
        offers = offers or self._load_reward_catalog()
        reward_maps: Dict[str, Dict[str, float]] = {}
        skipped_card_ids: List[str] = []

        for card in cards:
            rate_map = self._find_reward_map_for_institution(card.institution_name, offers)
            if rate_map:
                reward_maps[card.card_id] = rate_map
            else:
                skipped_card_ids.append(card.card_id)

        return reward_maps, skipped_card_ids

    def _load_reward_catalog(self) -> List[Dict[str, Any]]:
        if self._reward_catalog_cache is not None:
            return self._reward_catalog_cache

        if not self._env_loaded:
            # Allow the service to run from its own folder while still reading root project env files.
            load_dotenv(dotenv_path=".env", override=False)
            load_dotenv(dotenv_path="../.env", override=False)
            load_dotenv(dotenv_path="../.env.local", override=False)
            self._env_loaded = True

        supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

        if not supabase_url or not service_role_key:
            return []

        endpoint = f"{supabase_url.rstrip('/')}/rest/v1/credit_card_offers"
        headers = {
            "apikey": service_role_key,
            "Authorization": f"Bearer {service_role_key}",
        }
        params = {
            "select": "id,name,issuer,earn_rate_grocery,earn_rate_travel,earn_rate_dining,earn_rate_other,annual_fee,is_active",
            "is_active": "eq.true",
            "limit": "1000",
        }

        offers: List[Dict[str, Any]] = []
        try:
            with httpx.Client(timeout=8.0) as client:
                response = client.get(endpoint, headers=headers, params=params)
                response.raise_for_status()
                payload = response.json()
                if isinstance(payload, list):
                    offers = [item for item in payload if isinstance(item, dict)]
        except Exception:
            offers = []

        self._reward_catalog_cache = offers
        return offers

    def _find_reward_map_for_institution(
        self,
        institution_name: Optional[str],
        offers: List[Dict[str, Any]],
    ) -> Optional[Dict[str, float]]:
        institution_key = self._normalize_identity(institution_name)
        if not institution_key:
            return None

        best_score = -1
        best_offers: List[Dict[str, Any]] = []

        for offer in offers:
            score = self._match_offer_score(institution_key, offer)
            if score < 0:
                continue
            if score > best_score:
                best_score = score
                best_offers = [offer]
            elif score == best_score:
                best_offers.append(offer)

        if not best_offers:
            return None

        # Merge best-matching offers to keep the highest available rate per category.
        merged: Dict[str, float] = {}
        for offer in best_offers:
            offer_map = self._offer_to_rate_map(offer)
            for category, value in offer_map.items():
                merged[category] = max(merged.get(category, 0.0), value)

        return merged or None

    def _match_offer_score(self, institution_key: str, offer: Dict[str, Any]) -> int:
        issuer_key = self._normalize_identity(offer.get("issuer"))
        name_key = self._normalize_identity(offer.get("name"))

        keys = [k for k in (issuer_key, name_key) if k]
        if not keys:
            return -1

        for key in keys:
            if institution_key == key:
                return 100
            if institution_key in key or key in institution_key:
                return 80

        institution_tokens = set(institution_key.split())
        best_overlap = 0
        for key in keys:
            overlap = len(institution_tokens.intersection(set(key.split())))
            best_overlap = max(best_overlap, overlap)

        if best_overlap == 0:
            return -1
        return best_overlap

    def _offer_to_rate_map(self, offer: Dict[str, Any]) -> Dict[str, float]:
        def normalize(raw_value: Any) -> float:
            try:
                raw = float(raw_value)
            except Exception:
                return 0.0

            if raw <= 0:
                return 0.0
            if raw <= 0.2:
                return raw
            if raw <= 10:
                return raw / 100
            return raw / 1000

        categories = {
            "groceries": normalize(offer.get("earn_rate_grocery")),
            "travel": normalize(offer.get("earn_rate_travel")),
            "dining": normalize(offer.get("earn_rate_dining")),
            "default": normalize(offer.get("earn_rate_other")),
        }

        return {key: value for key, value in categories.items() if value > 0}

    def _category_to_reward_bucket(self, category: str) -> str:
        if category == "groceries":
            return "groceries"
        if category in {"travel", "transportation", "rideshare"}:
            return "travel"
        if category == "dining":
            return "dining"
        return "default"

    def _best_offer_for_bucket(
        self,
        offers: List[Dict[str, Any]],
        bucket: str,
    ) -> Tuple[Optional[Dict[str, Any]], float]:
        best_offer: Optional[Dict[str, Any]] = None
        best_rate = 0.0

        for offer in offers:
            rate_map = self._offer_to_rate_map(offer)
            rate = rate_map.get(bucket)
            if rate is None:
                rate = rate_map.get("default", 0.0)

            if rate > best_rate:
                best_rate = rate
                best_offer = offer

        return best_offer, best_rate

    def _build_upgrade_opportunities(
        self,
        txns: List[_Txn],
        cards,
        offers: List[Dict[str, Any]],
        lookback_days: int,
    ) -> List[UpgradeOpportunity]:
        if not txns or not cards or not offers:
            return []

        excluded_categories = {
            "payments", "income", "transfers", "cash", "fees", "taxes", "government",
            "rent", "mortgage",
        }

        spend_by_category: Dict[str, float] = defaultdict(float)
        for txn in txns:
            if txn.amount <= 0:
                continue
            if txn.category in excluded_categories:
                continue
            spend_by_category[txn.category] += txn.amount

        if not spend_by_category:
            return []

        total_spend = sum(spend_by_category.values())
        if total_spend <= 0:
            return []

        lookback_days = max(30, lookback_days)
        min_monthly_incremental = max(1.0, float(settings.MIN_INCREMENTAL_REWARD_DOLLARS))
        opportunities: List[UpgradeOpportunity] = []
        sorted_categories = sorted(spend_by_category.items(), key=lambda item: item[1], reverse=True)

        for category, category_spend in sorted_categories[:3]:
            estimated_monthly_spend = category_spend * (30.0 / float(lookback_days))

            # Avoid noisy suggestions for very small category spend.
            if estimated_monthly_spend < 120:
                continue

            spend_share_pct = (category_spend / total_spend) * 100
            current_best_rate = max(self._estimate_reward_rate(card, category) for card in cards)
            reward_bucket = self._category_to_reward_bucket(category)

            offer_candidates = self._top_offers_for_bucket(
                offers=offers,
                bucket=reward_bucket,
                current_best_rate=current_best_rate,
                estimated_monthly_spend=estimated_monthly_spend,
                limit=3,
            )
            if not offer_candidates:
                continue

            best = offer_candidates[0]
            monthly_incremental = best.get("estimated_monthly_incremental_reward", 0.0) or 0.0
            annual_incremental = best.get("estimated_annual_incremental_reward", 0.0) or 0.0
            if monthly_incremental < min_monthly_incremental:
                continue

            offer_name = best.get("name") or "a better rewards card"
            insight_message = {
                "en": (
                    f"You spend about {spend_share_pct:.1f}% of tracked spend on {category}. "
                    f"Using {offer_name} for this category could add about ${monthly_incremental:.2f}/month "
                    f"(${annual_incremental:.2f}/year) in rewards."
                ),
                "fr": (
                    f"Vous depensez environ {spend_share_pct:.1f}% de vos depenses suivies en {category}. "
                    f"Utiliser {offer_name} pour cette categorie pourrait ajouter environ "
                    f"{monthly_incremental:.2f}$ par mois ({annual_incremental:.2f}$ par an) en recompenses."
                ),
                "ar": (
                    f"تنفق حوالي {spend_share_pct:.1f}% من الإنفاق المتتبع على فئة {category}. "
                    f"استخدام بطاقة {offer_name} لهذه الفئة قد يضيف حوالي ${monthly_incremental:.2f} شهريا "
                    f"(${annual_incremental:.2f} سنويا) من المكافآت."
                ),
            }

            opportunities.append(
                UpgradeOpportunity(
                    top_spend_category=category,
                    estimated_monthly_spend=round(estimated_monthly_spend, 2),
                    spend_share_percentage=round(spend_share_pct, 2),
                    current_best_reward_rate=round(current_best_rate, 4),
                    suggested_offer_name=best.get("name"),
                    suggested_offer_issuer=best.get("issuer"),
                    suggested_offer_id=best.get("offer_id"),
                    suggested_offer_reward_rate=best.get("reward_rate"),
                    estimated_monthly_incremental_reward=round(monthly_incremental, 2),
                    estimated_annual_incremental_reward=round(annual_incremental, 2),
                    annual_fee=best.get("annual_fee"),
                    suggested_offers=offer_candidates,
                    insight_message=insight_message,
                )
            )

        opportunities.sort(
            key=lambda item: (
                item.estimated_monthly_incremental_reward or 0.0,
                item.spend_share_percentage or 0.0,
            ),
            reverse=True,
        )
        return opportunities

    def _top_offers_for_bucket(
        self,
        offers: List[Dict[str, Any]],
        bucket: str,
        current_best_rate: float,
        estimated_monthly_spend: float,
        limit: int = 3,
    ) -> List[Dict[str, Any]]:
        candidates: List[Dict[str, Any]] = []

        for offer in offers:
            rate_map = self._offer_to_rate_map(offer)
            rate = rate_map.get(bucket)
            if rate is None:
                rate = rate_map.get("default", 0.0)
            if rate <= current_best_rate:
                continue

            annual_fee = self._safe_float(offer.get("annual_fee"))
            monthly_incremental = estimated_monthly_spend * (rate - current_best_rate)
            annual_incremental = monthly_incremental * 12.0

            candidates.append(
                {
                    "offer_id": offer.get("id"),
                    "name": offer.get("name"),
                    "issuer": offer.get("issuer"),
                    "reward_rate": round(rate, 4),
                    "annual_fee": annual_fee,
                    "estimated_monthly_incremental_reward": round(monthly_incremental, 2),
                    "estimated_annual_incremental_reward": round(annual_incremental, 2),
                }
            )

        if not candidates:
            return []

        deduped: Dict[str, Dict[str, Any]] = {}
        for candidate in candidates:
            key = self._normalize_identity(f"{candidate.get('issuer', '')} {candidate.get('name', '')}")
            existing = deduped.get(key)
            if existing is None or (
                candidate.get("estimated_monthly_incremental_reward", 0.0)
                > existing.get("estimated_monthly_incremental_reward", 0.0)
            ):
                deduped[key] = candidate

        ordered = sorted(
            deduped.values(),
            key=lambda c: (
                0 if (c.get("annual_fee") is None or c.get("annual_fee") <= 0) else 1,
                -c.get("estimated_monthly_incremental_reward", 0.0),
                -c.get("reward_rate", 0.0),
            ),
        )
        return ordered[:max(1, limit)]

    def _safe_float(self, value: Any) -> Optional[float]:
        if value is None:
            return None
        try:
            return float(value)
        except Exception:
            return None

    def _normalize_identity(self, value: Optional[str]) -> str:
        if not value:
            return ""

        normalized = "".join(ch.lower() if ch.isalnum() else " " for ch in value)
        return " ".join(token for token in normalized.split() if token)

    def _utilization_from_txn(self, txn: _Txn, credit_limit: float) -> Optional[float]:
        if txn.balance is not None:
            return max(0.0, min(100.0, (txn.balance / credit_limit) * 100))
        return None

    def _bucket_for_utilization(self, utilization: float) -> str:
        if utilization < 30:
            return "low"
        if utilization < 70:
            return "medium"
        return "high"

    def _normalize_category(self, value: Optional[str]) -> str:
        return infer_shared_category(value)

    def _safe_parse_date(self, value: str) -> Optional[datetime]:
        if not value:
            return None
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00")).replace(tzinfo=None)
        except Exception:
            pass
        for fmt in ("%Y-%m-%d", "%Y/%m/%d"):
            try:
                return datetime.strptime(value, fmt)
            except Exception:
                continue
        return None

    def _days_until_due(self, due_date_str: Optional[str]) -> Optional[int]:
        if not due_date_str:
            return None
        due_date = self._safe_parse_date(due_date_str)
        if due_date is None:
            return None
        return (due_date - datetime.utcnow()).days


stochastic_planner = StochasticPlanner()
