"""
Credit Analyzer Service
Analyzes credit data and generates insights using hybrid (rules + ML) approach
"""

from typing import List
from app.models.schemas import (
    AnalyzeCreditRequest,
    AnalyzeCreditResponse,
    CreditInsight,
    CardData,
    PaymentRecommendation,
    ExpectedImpact
)
from app.ml.models import ml_models
from datetime import datetime, timedelta


class CreditAnalyzer:
    """
    Credit analysis engine
    Uses hybrid approach: rule-based logic + ML predictions
    """
    
    def __init__(self):
        """Initialize analyzer"""
        self.ml_models = ml_models
    
    def analyze(self, request: AnalyzeCreditRequest) -> AnalyzeCreditResponse:
        """
        Analyze credit data and generate insights
        
        Returns:
        - Overall credit health score (0-100)
        - Personalized insights and recommendations
        - Alerts for high utilization or payment due dates
        """
        cards = request.cards
        
        # Calculate overall score
        overall_score = self.calculate_overall_score(cards)
        
        # Generate insights
        insights = self.generate_insights(cards)
        
        # Generate payment recommendations (default strategy)
        recommendations = self._generate_basic_recommendations(cards)
        
        return AnalyzeCreditResponse(
            user_id=request.user_id,
            overall_score=overall_score,
            insights=insights,
            recommendations=recommendations,
            analysis_timestamp=datetime.utcnow().isoformat()
        )
    
    def calculate_overall_score(self, cards: List[CardData]) -> float:
        """
        Calculate overall credit health score (0-100)
        
        Factors:
        - Average utilization across all cards (40% weight)
        - Number of high utilization cards (20% weight)
        - Payment history indicators (20% weight)
        - Total available credit (10% weight)
        - Account diversity (10% weight)
        """
        if not cards:
            return 0.0
        
        score = 100.0
        
        # 1. Overall utilization (lower is better) - uses total balance / total limit
        total_balance = sum(card.current_balance for card in cards)
        total_limit = sum(card.credit_limit for card in cards)
        overall_utilization = (total_balance / total_limit * 100) if total_limit > 0 else 0
        
        if overall_utilization > 70:
            score -= 40
        elif overall_utilization > 50:
            score -= 30
        elif overall_utilization > 30:
            score -= 15
        elif overall_utilization > 10:
            score -= 5
        
        # 2. High utilization cards penalty
        high_util_cards = sum(1 for card in cards if card.utilization_percentage > 70)
        score -= high_util_cards * 10
        
        # 3. Payment history (if available)
        late_payments = sum(
            1 for card in cards 
            if card.payment_due_date and self._is_payment_overdue(card.payment_due_date)
        )
        score -= late_payments * 15
        
        # 4. Total available credit (having more is good)
        total_available = sum(
            card.credit_limit - card.current_balance 
            for card in cards
        )
        if total_available > 10000:
            score += 5
        elif total_available > 5000:
            score += 3
        
        # 5. Account diversity (multiple cards is good if managed well)
        if len(cards) >= 2 and overall_utilization < 30:
            score += 5
        
        return max(0.0, min(100.0, score))
    
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
        
        # 1. High utilization alerts
        for card in cards:
            if card.utilization_percentage > 70:
                insights.append(CreditInsight(
                    type="alert",
                    priority="urgent",
                    title=self.translate_text("Danger Zone - Critical utilization"),
                    message=self.translate_text(
                        f"{card.institution_name} card is at {card.utilization_percentage:.1f}% utilization. "
                        f"This is severely impacting your credit score. Urgent action required! "
                        f"Pay down ${card.current_balance - (card.credit_limit * 0.30):.2f} to reach the safe 30% threshold."
                    ),
                    action_required=True,
                    metadata={
                        "card_id": card.card_id,
                        "current_utilization": card.utilization_percentage,
                        "recommended_payment": card.current_balance - (card.credit_limit * 0.30)
                    }
                ))
            elif card.utilization_percentage > 30:
                insights.append(CreditInsight(
                    type="alert",
                    priority="high",
                    title=self.translate_text("Danger Zone - High utilization"),
                    message=self.translate_text(
                        f"{card.institution_name} card is at {card.utilization_percentage:.1f}% utilization. "
                        f"Above 30% is not recommended and will negatively impact your credit score. "
                        f"Pay down ${card.current_balance - (card.credit_limit * 0.30):.2f} to reach the recommended 30% threshold."
                    ),
                    action_required=True,
                    metadata={
                        "card_id": card.card_id,
                        "current_utilization": card.utilization_percentage,
                        "recommended_payment": card.current_balance - (card.credit_limit * 0.30)
                    }
                ))
            elif card.utilization_percentage > 25:
                insights.append(CreditInsight(
                    type="recommendation",
                    priority="medium",
                    title=self.translate_text("Caution Zone - Moderate utilization"),
                    message=self.translate_text(
                        f"{card.institution_name} card is at {card.utilization_percentage:.1f}% utilization. "
                        f"You're in the caution zone (26-30%). Try to keep it below 25% for optimal credit health."
                    ),
                    action_required=False,
                    metadata={
                        "card_id": card.card_id,
                        "current_utilization": card.utilization_percentage
                    }
                ))
            elif card.utilization_percentage <= 25:
                insights.append(CreditInsight(
                    type="achievement",
                    priority="low",
                    title=self.translate_text("Safe Zone - Excellent utilization"),
                    message=self.translate_text(
                        f"{card.institution_name} card is at {card.utilization_percentage:.1f}% utilization. "
                        f"Perfect! You're in the safe zone (0-25%). This is great for your credit score."
                    ),
                    action_required=False,
                    metadata={
                        "card_id": card.card_id,
                        "current_utilization": card.utilization_percentage
                    }
                ))
        
        # 2. Payment due date reminders
        for card in cards:
            if card.payment_due_date:
                days_until_due = self._days_until_due(card.payment_due_date)
                
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
        
        # 3. Credit improvement tips
        # Calculate overall utilization (total balance / total limit)
        total_balance = sum(card.current_balance for card in cards) if cards else 0
        total_limit = sum(card.credit_limit for card in cards) if cards else 0
        overall_utilization = (total_balance / total_limit * 100) if total_limit > 0 else 0
        
        if overall_utilization > 30:
            insights.append(CreditInsight(
                type="tip",
                priority="medium",
                title=self.translate_text("Credit improvement tip"),
                message=self.translate_text(
                    f"Your overall utilization is {overall_utilization:.1f}%. "
                    f"Experts recommend keeping it below 30% for optimal credit health. "
                    f"Consider increasing your credit limits or paying down balances."
                ),
                action_required=False,
                metadata={
                    "overall_utilization": overall_utilization,
                    "recommended_utilization": 30
                }
            ))
        
        # 4. Spending pattern analysis based on utilization
        if cards and len(cards) > 0:
            # Determine spending pattern based on overall utilization
            if overall_utilization > 50:
                spending_pattern = "aggressive"
                pattern_message = f"Your spending pattern shows high credit usage ({overall_utilization:.1f}% overall utilization). Consider budgeting strategies to reduce balances and avoid interest charges."
                pattern_priority = "medium"
            elif overall_utilization > 25:
                spending_pattern = "moderate"
                pattern_message = f"Your spending pattern is moderate ({overall_utilization:.1f}% overall utilization). Continue monitoring your balances to stay in the safe zone (below 25%)."
                pattern_priority = "low"
            else:
                spending_pattern = "conservative"
                pattern_message = f"Your spending pattern is conservative ({overall_utilization:.1f}% overall utilization). You're managing credit responsibly - great job!"
                pattern_priority = "low"
            
            insights.append(CreditInsight(
                type="tip",
                priority=pattern_priority,
                title=self.translate_text("Spending pattern analysis"),
                message=self.translate_text(pattern_message),
                action_required=False,
                metadata={
                    'spending_pattern': spending_pattern,
                    'overall_utilization': overall_utilization
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
                        utilization_improvement=(recommended_amount / card.credit_limit) * 100,
                        score_impact_estimate=5.0
                    ),
                    priority=idx
                ))
        
        return recommendations
    
    def _days_until_due(self, due_date_str: str) -> int:
        """Calculate days until payment due date"""
        try:
            due_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00'))
            delta = due_date - datetime.now()
            return delta.days
        except:
            return 999  # Default to far future if parsing fails
    
    def _is_payment_overdue(self, due_date_str: str) -> bool:
        """Check if payment is overdue"""
        return self._days_until_due(due_date_str) < 0
    
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

