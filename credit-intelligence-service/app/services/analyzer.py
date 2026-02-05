"""
Credit Analyzer Service
Analyzes credit data and generates insights using rules-based logic
TODO: Replace with ML model when ready
"""

from typing import List
from app.models.schemas import (
    AnalyzeCreditRequest,
    AnalyzeCreditResponse,
    CreditInsight,
    CardData
)
from datetime import datetime


class CreditAnalyzer:
    """
    Credit analysis engine
    Initially uses rules-based logic, later ML model
    """
    
    def __init__(self):
        """Initialize analyzer"""
        # TODO: Load ML model if available
        pass
    
    def analyze(self, request: AnalyzeCreditRequest) -> AnalyzeCreditResponse:
        """
        Analyze credit data and generate insights
        
        TODO: Implement analysis logic
        - Calculate overall credit score (0-100)
        - Generate insights based on rules:
          - High utilization alerts (>30%)
          - Payment due date reminders
          - Achievement notifications (paid off card, etc.)
          - Credit improvement tips
        - Prioritize insights by urgency
        - Return multilingual insights
        """
        cards = request.cards
        overall_score = self.calculate_overall_score(cards)
        insights = self.generate_insights(cards)
        return AnalyzeCreditResponse(
            user_id=request.user_id,
            overall_score=overall_score,
            insights=insights,
            recommendations=[],
            analysis_timestamp=datetime.utcnow().isoformat(),
        )
    
    def calculate_overall_score(self, cards: List[CardData]) -> float:
        """
        Calculate overall credit health score (0-100)
        
        TODO: Implement scoring logic
        - Factor in utilization across all cards
        - Consider payment history
        - Account for number of active cards
        - Weight by credit limits
        """
        if not cards:
            return 0.0

        total_limit = sum(card.credit_limit for card in cards if card.credit_limit > 0)
        total_balance = sum(card.current_balance for card in cards)
        avg_utilization = (total_balance / total_limit) * 100 if total_limit > 0 else 0

        utilization_score = max(0.0, 100 - (avg_utilization * 1.2))

        due_penalty = 0.0
        now = datetime.utcnow().date()
        for card in cards:
            if not card.payment_due_date:
                continue
            try:
                due_date = datetime.fromisoformat(card.payment_due_date).date()
                days_until_due = (due_date - now).days
                if days_until_due <= 3:
                    due_penalty += 8
                elif days_until_due <= 7:
                    due_penalty += 4
            except ValueError:
                continue

        score = max(0.0, min(100.0, utilization_score - due_penalty))
        return round(score, 2)
    
    def generate_insights(self, cards: List[CardData]) -> List[CreditInsight]:
        """
        Generate insights based on credit data
        
        TODO: Implement rules-based insights
        - High utilization alert: >70% = urgent, >50% = high, >30% = medium
        - Payment due soon: <3 days = urgent, <7 days = high
        - Unused credit: <10% utilization for 3 months = tip to use occasionally
        - Payment success: Paid off card = achievement
        - Improvement opportunity: Reduce utilization = recommendation
        """
        insights: List[CreditInsight] = []
        now = datetime.utcnow().date()

        for card in cards:
            utilization = card.utilization_percentage

            if utilization >= 70:
                insights.append(
                    self._build_insight(
                        insight_type="alert",
                        priority="urgent",
                        title=f"High utilization on {card.institution_name}",
                        message=(
                            f"Your utilization is {utilization:.0f}% on {card.institution_name}. "
                            "Pay down the balance to protect your score."
                        ),
                        action_required=True,
                        metadata={"card_id": card.card_id, "utilization": utilization},
                    )
                )
            elif utilization >= 50:
                insights.append(
                    self._build_insight(
                        insight_type="alert",
                        priority="high",
                        title=f"Utilization climbing on {card.institution_name}",
                        message=(
                            f"Utilization is {utilization:.0f}% on {card.institution_name}. "
                            "Consider an extra payment to lower it."
                        ),
                        action_required=True,
                        metadata={"card_id": card.card_id, "utilization": utilization},
                    )
                )
            elif utilization >= 30:
                insights.append(
                    self._build_insight(
                        insight_type="recommendation",
                        priority="medium",
                        title=f"Keep utilization under 30%",
                        message=(
                            f"{card.institution_name} utilization is {utilization:.0f}%. "
                            "Lower balances to improve credit health."
                        ),
                        action_required=False,
                        metadata={"card_id": card.card_id, "utilization": utilization},
                    )
                )
            elif utilization < 10:
                insights.append(
                    self._build_insight(
                        insight_type="tip",
                        priority="low",
                        title=f"Light activity helps credit history",
                        message=(
                            f"{card.institution_name} utilization is low at {utilization:.0f}%. "
                            "Small regular usage can help keep the account active."
                        ),
                        action_required=False,
                        metadata={"card_id": card.card_id, "utilization": utilization},
                    )
                )

            if card.payment_due_date:
                try:
                    due_date = datetime.fromisoformat(card.payment_due_date).date()
                    days_until_due = (due_date - now).days
                    if days_until_due <= 3:
                        insights.append(
                            self._build_insight(
                                insight_type="alert",
                                priority="urgent",
                                title="Payment due soon",
                                message=(
                                    f"{card.institution_name} payment is due in {days_until_due} day(s). "
                                    "Pay at least the minimum to avoid late fees."
                                ),
                                action_required=True,
                                metadata={"card_id": card.card_id, "days_until_due": days_until_due},
                            )
                        )
                    elif days_until_due <= 7:
                        insights.append(
                            self._build_insight(
                                insight_type="alert",
                                priority="high",
                                title="Upcoming payment due",
                                message=(
                                    f"{card.institution_name} payment is due in {days_until_due} day(s). "
                                    "Schedule a payment now."
                                ),
                                action_required=True,
                                metadata={"card_id": card.card_id, "days_until_due": days_until_due},
                            )
                        )
                except ValueError:
                    continue

        return insights
    
    def translate_insight(self, insight: str) -> dict:
        """
        Translate insight to multiple languages
        
        TODO: Implement translation
        - Use translation service or predefined templates
        - Return dict with {en, fr, ar} keys
        """
        # TODO: Implementation needed
        return {
            "en": insight,
            "fr": insight,  # TODO: Translate
            "ar": insight,  # TODO: Translate
        }

    def _build_insight(
        self,
        insight_type: str,
        priority: str,
        title: str,
        message: str,
        action_required: bool,
        metadata: dict | None = None,
    ) -> CreditInsight:
        return CreditInsight(
            type=insight_type,
            priority=priority,
            title=self.translate_insight(title),
            message=self.translate_insight(message),
            action_required=action_required,
            metadata=metadata,
        )

