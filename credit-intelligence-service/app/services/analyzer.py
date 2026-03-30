"""
Credit Analyzer Service
Analyzes credit data and generates deterministic rule-based insights.
"""

from typing import List, Optional
from app.models.schemas import (
    AnalyzeCreditRequest,
    AnalyzeCreditResponse,
    CreditInsight,
    CardData,
    PaymentRecommendation,
    ExpectedImpact
)
from datetime import datetime


class CreditAnalyzer:
    """
    Credit analysis engine
    Uses deterministic rule-based logic.
    """
    
    def analyze(self, request: AnalyzeCreditRequest) -> AnalyzeCreditResponse:
        """
        Analyze credit data and generate insights
        
        Returns:
        - Personalized insights and recommendations
        - Alerts for payment due dates
        """
        cards = request.cards
        
        # Generate insights
        insights = self.generate_insights(cards)
        
        # Generate payment recommendations (default strategy)
        recommendations = self._generate_basic_recommendations(cards)
        
        return AnalyzeCreditResponse(
            user_id=request.user_id,
            insights=insights,
            recommendations=recommendations,
            analysis_timestamp=datetime.utcnow().isoformat()
        )
    
    def generate_insights(self, cards: List[CardData]) -> List[CreditInsight]:
        """
        Generate insights based on credit data
        
        Insight types:
        - alert: Urgent actions needed
        - recommendation: Suggestions for improvement
        - achievement: Positive behaviors
        - tip: General credit wisdom
        """
        insights = []

        # 1. Payment due date reminders
        for card in cards:
            if card.payment_due_date:
                days_until_due = self._days_until_due(card.payment_due_date)
                if days_until_due is None:
                    continue
                
                if 0 <= days_until_due <= 3:
                    insights.append(CreditInsight(
                        type="alert",
                        priority="urgent",
                        title=self.translate_text("Payment due soon"),
                        message=self.translate_text(
                            f"⚠️ {card.institution_name} payment due in {days_until_due} days! "
                            f"Minimum payment: ${card.minimum_payment:.2f}"
                        ),
                        action_required=True,
                        metadata={
                            "card_id": card.card_id,
                            "days_until_due": days_until_due,
                            "minimum_payment": card.minimum_payment
                        }
                    ))
                elif 0 <= days_until_due <= 7:
                    insights.append(CreditInsight(
                        type="recommendation",
                        priority="high",
                        title=self.translate_text("Upcoming payment"),
                        message=self.translate_text(
                            f"{card.institution_name} payment due in {days_until_due} days. "
                            f"Minimum payment: ${card.minimum_payment:.2f}"
                        ),
                        action_required=False,
                        metadata={
                            "card_id": card.card_id,
                            "days_until_due": days_until_due,
                            "minimum_payment": card.minimum_payment
                        }
                    ))

        # Sort insights by priority
        priority_order = {"urgent": 0, "high": 1, "medium": 2, "low": 3}
        insights.sort(key=lambda x: priority_order.get(x.priority, 4))
        
        return insights
    
    def _generate_basic_recommendations(self, cards: List[CardData]) -> List[PaymentRecommendation]:
        """Generate basic payment recommendations"""
        recommendations = []
        
        for idx, card in enumerate(cards, 1):
            if card.current_balance > 0:
                # Recommend at least minimum payment
                recommended_amount = max(
                    card.minimum_payment,
                    card.current_balance * 0.1  # Or 10% of balance
                )
                
                recommendations.append(PaymentRecommendation(
                    card_id=card.card_id,
                    suggested_amount=recommended_amount,
                    reasoning=self.translate_text(
                        f"Pay at least ${recommended_amount:.2f} to maintain good standing"
                    ),
                    expected_impact=ExpectedImpact(
                        interest_saved=0.0,  # Calculate later
                        utilization_improvement=(recommended_amount / card.credit_limit) * 100
                    ),
                    priority=idx
                ))
        
        return recommendations
    
    def _days_until_due(self, due_date_str: str) -> Optional[int]:
        """Calculate days until payment due date. Returns None when parsing fails."""
        try:
            due_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00'))
            delta = due_date - datetime.now()
            return delta.days
        except:
            return None
    
    def _is_payment_overdue(self, due_date_str: str) -> bool:
        """Check if payment is overdue"""
        days_until_due = self._days_until_due(due_date_str)
        if days_until_due is None:
            return False
        return days_until_due < 0
    
    def translate_text(self, text: str) -> dict:
        """
        Translate text to multiple languages
        
        For demo purposes, returns the same text for all languages
        In production, integrate with a translation service
        """
        return {
            "en": text,
            "fr": text,  # TODO: Implement French translation
            "ar": text,  # TODO: Implement Arabic translation
        }

