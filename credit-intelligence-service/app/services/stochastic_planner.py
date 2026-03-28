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
    CardActionValue,
    CardChoiceCounterfactual,
)


CANONICAL_CATEGORIES = [
    "groceries",
    "gas",
    "dining",
    "shopping",
    "travel",
    "entertainment",
    "bills",
    "healthcare",
    "education",
    "other",
]


CATEGORY_KEYWORDS = {
    "groceries": ["grocery", "supermarket", "food basics", "costco", "loblaws", "metro", "sobeys"],
    "gas": ["gas", "fuel", "shell", "esso", "petro", "ultramar", "chevron"],
    "dining": ["restaurant", "cafe", "coffee", "tim hortons", "mcdonald", "uber eats", "doordash"],
    "shopping": ["amazon", "walmart", "best buy", "winners", "mall", "retail"],
    "travel": ["air", "flight", "hotel", "airbnb", "uber", "lyft", "expedia"],
    "entertainment": ["netflix", "spotify", "cineplex", "steam", "itunes", "disney"],
    "bills": ["hydro", "internet", "phone", "insurance", "bill", "utility", "rogers", "bell"],
    "healthcare": ["pharmacy", "clinic", "dental", "hospital", "vision", "med"],
    "education": ["tuition", "course", "university", "college", "bookstore", "udemy"],
}


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
        transactions = self._filter_and_normalize_transactions(
            transactions=request.transactions,
            lookback_days=request.lookback_days,
        )

        if not transactions:
            default_probs = [
                CategoryProbability(category=cat, probability=round(1 / len(CANONICAL_CATEGORIES), 4))
                for cat in CANONICAL_CATEGORIES
            ]
            return SpendingProbabilityResponse(
                user_id=request.user_id,
                current_category="other",
                probabilities=default_probs,
                top_category="other",
                transition_counts={cat: {dst: 0 for dst in CANONICAL_CATEGORIES} for cat in CANONICAL_CATEGORIES},
                computed_at=datetime.utcnow().isoformat(),
            )

        transitions = self._build_category_transition_counts(transactions)
        current_category = self._normalize_category(request.current_category) if request.current_category else transactions[-1].category
        current_category = current_category if current_category in CANONICAL_CATEGORIES else "other"

        alpha = 1.0
        row = transitions[current_category]
        row_total = sum(row.values())
        denom = row_total + alpha * len(CANONICAL_CATEGORIES)

        probs = []
        for cat in CANONICAL_CATEGORIES:
            p = (row.get(cat, 0) + alpha) / denom
            probs.append(CategoryProbability(category=cat, probability=round(p, 6)))

        probs.sort(key=lambda x: x.probability, reverse=True)
        top_category = probs[0].category if probs else "other"

        return SpendingProbabilityResponse(
            user_id=request.user_id,
            current_category=current_category,
            probabilities=probs,
            top_category=top_category,
            transition_counts={
                src: {dst: int(counts.get(dst, 0)) for dst in CANONICAL_CATEGORIES}
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

        resolved_reward_maps, skipped_card_ids = self._resolve_reward_maps(request.cards)
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

        card_limits = {card.card_id: card.credit_limit for card in eligible_cards}
        transition_by_card = self._build_card_bucket_transitions(
            transactions=txns,
            merchant_category=merchant_category,
            card_limits=card_limits,
        )

        gamma = 0.9
        action_values: List[CardActionValue] = []

        for card in eligible_cards:
            transitions = transition_by_card.get(card.card_id) or self._default_bucket_transition_matrix()
            state_bucket = self._bucket_for_utilization(card.utilization_percentage)

            value_vector = self._evaluate_action_markov_reward(
                card=card,
                merchant_category=merchant_category,
                estimated_amount=request.estimated_amount,
                transitions=transitions,
                gamma=gamma,
            )

            immediate = self._state_reward(
                card=card,
                util_bucket=state_bucket,
                merchant_category=merchant_category,
                estimated_amount=request.estimated_amount,
            )
            expected_next = sum(
                transitions[state_bucket][dst] * value_vector[dst]
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

        action_values.sort(key=lambda a: a.q_value, reverse=True)
        recommended = action_values[0].card_id if action_values else eligible_cards[0].card_id

        baseline_card_id, estimated_monthly_spend = self._infer_baseline_and_monthly_spend(
            txns=txns,
            merchant_category=merchant_category,
            fallback_amount=request.estimated_amount,
            lookback_days=request.lookback_days,
        )

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

        min_incremental = max(0.0, float(settings.MIN_INCREMENTAL_REWARD_DOLLARS))
        if incremental_reward < min_incremental:
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

        return CardChoiceResponse(
            user_id=request.user_id,
            merchant_name=request.merchant_name,
            merchant_category=merchant_category,
            recommended_card_id=recommended,
            policy_reasoning=reason,
            action_values=action_values,
            counterfactual=counterfactual,
            computed_at=datetime.utcnow().isoformat(),
        )

    def _infer_baseline_and_monthly_spend(
        self,
        txns: List[_Txn],
        merchant_category: str,
        fallback_amount: float,
        lookback_days: int,
    ) -> Tuple[Optional[str], float]:
        if not txns:
            return None, round(fallback_amount * 2, 2)

        filtered = [t for t in txns if t.category == merchant_category and t.amount > 0]
        if not filtered:
            return None, round(fallback_amount * 2, 2)

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

            raw_category = txn.category or txn.merchant_name or txn.description
            category = self._normalize_category(raw_category)

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

    def _build_category_transition_counts(self, transactions: List[_Txn]) -> Dict[str, Dict[str, int]]:
        transitions = {src: {dst: 0 for dst in CANONICAL_CATEGORIES} for src in CANONICAL_CATEGORIES}

        if len(transactions) < 2:
            return transitions

        for prev_txn, next_txn in zip(transactions[:-1], transactions[1:]):
            src = prev_txn.category if prev_txn.category in CANONICAL_CATEGORIES else "other"
            dst = next_txn.category if next_txn.category in CANONICAL_CATEGORIES else "other"
            transitions[src][dst] += 1

        return transitions

    def _build_card_bucket_transitions(
        self,
        transactions: List[_Txn],
        merchant_category: str,
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
                matrices[card_id] = self._default_bucket_transition_matrix()
                continue

            for current_txn, next_txn in zip(txns[:-1], txns[1:]):
                if current_txn.category != merchant_category:
                    continue
                current_util = self._utilization_from_txn(current_txn, card_limit)
                next_util = self._utilization_from_txn(next_txn, card_limit)
                src = self._bucket_for_utilization(current_util)
                dst = self._bucket_for_utilization(next_util)
                counts[src][dst] += 1

            matrices[card_id] = self._normalize_bucket_counts(counts)

        return matrices

    def _normalize_bucket_counts(self, counts: Dict[str, Dict[str, int]]) -> Dict[str, Dict[str, float]]:
        alpha = 1.0
        normalized: Dict[str, Dict[str, float]] = {}
        for src in ("low", "medium", "high"):
            row = counts[src]
            total = sum(row.values())
            denom = total + alpha * 3
            normalized[src] = {
                dst: (row.get(dst, 0) + alpha) / denom
                for dst in ("low", "medium", "high")
            }
        return normalized

    def _default_bucket_transition_matrix(self) -> Dict[str, Dict[str, float]]:
        return {
            "low": {"low": 0.7, "medium": 0.25, "high": 0.05},
            "medium": {"low": 0.2, "medium": 0.6, "high": 0.2},
            "high": {"low": 0.05, "medium": 0.35, "high": 0.6},
        }

    def _evaluate_action_markov_reward(
        self,
        card,
        merchant_category: str,
        estimated_amount: float,
        transitions: Dict[str, Dict[str, float]],
        gamma: float,
        iterations: int = 20,
    ) -> Dict[str, float]:
        states = ("low", "medium", "high")
        values = {s: 0.0 for s in states}

        for _ in range(iterations):
            updated = {}
            for state in states:
                reward = self._state_reward(
                    card=card,
                    util_bucket=state,
                    merchant_category=merchant_category,
                    estimated_amount=estimated_amount,
                )
                continuation = sum(transitions[state][nxt] * values[nxt] for nxt in states)
                updated[state] = reward + gamma * continuation
            values = updated

        return values

    def _state_reward(self, card, util_bucket: str, merchant_category: str, estimated_amount: float) -> float:
        reward_rate = self._estimate_reward_rate(card, merchant_category)
        reward_gain = estimated_amount * reward_rate

        util_midpoint = {"low": 20.0, "medium": 50.0, "high": 85.0}[util_bucket]
        post_util = min(100.0, util_midpoint + (estimated_amount / max(card.credit_limit, 1.0)) * 100)

        apr = card.interest_rate or 19.99
        interest_penalty = (apr / 100.0) * estimated_amount * 0.08

        util_penalty = 0.0
        if post_util > 30:
            util_penalty += ((post_util - 30) / 70) * 2.5
        if post_util > 70:
            util_penalty += 2.0

        due_penalty = 0.0
        days_to_due = self._days_until_due(card.payment_due_date)
        if 0 <= days_to_due <= 3:
            due_penalty = 1.5
        elif 4 <= days_to_due <= 7:
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

    def _resolve_reward_maps(self, cards) -> Tuple[Dict[str, Dict[str, float]], List[str]]:
        offers = self._load_reward_catalog()
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
            "select": "name,issuer,earn_rate_grocery,earn_rate_travel,earn_rate_dining,earn_rate_other,is_active",
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

    def _normalize_identity(self, value: Optional[str]) -> str:
        if not value:
            return ""

        normalized = "".join(ch.lower() if ch.isalnum() else " " for ch in value)
        return " ".join(token for token in normalized.split() if token)

    def _utilization_from_txn(self, txn: _Txn, credit_limit: float) -> float:
        if txn.balance is not None:
            return max(0.0, min(100.0, (txn.balance / credit_limit) * 100))
        # Fallback approximation if running balance is missing
        estimated_balance = max(0.0, txn.amount)
        return max(0.0, min(100.0, (estimated_balance / credit_limit) * 100))

    def _bucket_for_utilization(self, utilization: float) -> str:
        if utilization < 30:
            return "low"
        if utilization < 70:
            return "medium"
        return "high"

    def _normalize_category(self, value: Optional[str]) -> str:
        if not value:
            return "other"
        text = value.strip().lower()

        if text in CANONICAL_CATEGORIES:
            return text

        for category, keywords in CATEGORY_KEYWORDS.items():
            if any(keyword in text for keyword in keywords):
                return category

        return "other"

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

    def _days_until_due(self, due_date_str: Optional[str]) -> int:
        if not due_date_str:
            return 999
        due_date = self._safe_parse_date(due_date_str)
        if due_date is None:
            return 999
        return (due_date - datetime.utcnow()).days


stochastic_planner = StochasticPlanner()
