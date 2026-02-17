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
        
        # 1. Average utilization (lower is better)
        avg_utilization = sum(card.utilization_percentage for card in cards) / len(cards)
        if avg_utilization > 70:
            score -= 40
        elif avg_utilization > 50:
            score -= 30
        elif avg_utilization > 30:
            score -= 15
        elif avg_utilization > 10:
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
        if len(cards) >= 2 and avg_utilization < 30:
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
                    title=self.translate_text("High utilization detected"),
                    message=self.translate_text(
                        f"{card.institution_name} card is at {card.utilization_percentage:.1f}% utilization. "
                        f"This may negatively impact your credit score. Consider paying down ${card.current_balance - (card.credit_limit * 0.30):.2f} "
                        f"to reach the recommended 30% threshold."
                    ),
                    action_required=True,
                    metadata={
                        "card_id": card.card_id,
                        "current_utilization": card.utilization_percentage,
                        "recommended_payment": card.current_balance - (card.credit_limit * 0.30)
                    }
                ))
            elif card.utilization_percentage > 50:
                insights.append(CreditInsight(
                    type="recommendation",
                    priority="high",
                    title=self.translate_text("Moderate utilization warning"),
                    message=self.translate_text(
                        f"{card.institution_name} card is at {card.utilization_percentage:.1f}% utilization. "
                        f"Keeping it below 30% is ideal for your credit health."
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
        
        # 3. Low utilization achievement
        low_util_cards = [card for card in cards if card.utilization_percentage < 10]
        if low_util_cards:
            insights.append(CreditInsight(
                type="achievement",
                priority="low",
                title=self.translate_text("Excellent credit management"),
                message=self.translate_text(
                    f"Great job! You're keeping {len(low_util_cards)} card(s) below 10% utilization. "
                    f"This is excellent for your credit health."
                ),
                action_required=False,
                metadata={
                    "low_utilization_cards": len(low_util_cards)
                }
            ))
        
        # 4. Credit improvement tips
        avg_utilization = sum(card.utilization_percentage for card in cards) / len(cards) if cards else 0
        
        if avg_utilization > 30:
            insights.append(CreditInsight(
                type="tip",
                priority="medium",
                title=self.translate_text("Credit improvement tip"),
                message=self.translate_text(
                    f"Your average utilization is {avg_utilization:.1f}%. "
                    f"Experts recommend keeping it below 30% for optimal credit health. "
                    f"Consider increasing your credit limits or paying down balances."
                ),
                action_required=False,
                metadata={
                    "average_utilization": avg_utilization,
                    "recommended_utilization": 30
                }
            ))
        
        # 5. ML-based spending pattern insight
        if cards:
            # Use ML to detect spending patterns
            card = cards[0]  # Analyze primary card
            
            # Prepare features for spending pattern prediction
            features = {
                'credit_limit': card.credit_limit,
                'monthly_spending': card.current_balance,  # Approximation
                'utilization': card.utilization_percentage,
                'transaction_frequency': 15,  # Default (would come from real data)
                'avg_transaction_amount': card.current_balance / 15 if card.current_balance > 0 else 0,
                'groceries_pct': 25,  # Default percentages (would come from real transaction data)
                'dining_pct': 20,
                'shopping_pct': 20
            }
            
            spending_pattern = self.ml_models.predict_spending_pattern(features)
            
            pattern_messages = {
                'conservative': "Your spending pattern is conservative. You're managing credit responsibly!",
                'moderate': "Your spending pattern is moderate. Continue monitoring your balances.",
                'aggressive': "Your spending pattern shows higher credit usage. Consider budgeting strategies to reduce balances."
            }
            
            insights.append(CreditInsight(
                type="tip",
                priority="low",
                title=self.translate_text("Spending pattern analysis"),
                message=self.translate_text(pattern_messages.get(spending_pattern, "")),
                action_required=False,
                metadata={
                    'spending_pattern': spending_pattern
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

