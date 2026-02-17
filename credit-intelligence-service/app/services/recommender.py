"""
Payment Recommender Service
Generates optimized payment allocation strategies using hybrid (rules + ML) approach
"""

from typing import List, Dict
from app.models.schemas import (
    PaymentRecommendationRequest,
    PaymentRecommendationResponse,
    PaymentRecommendation,
    CardData,
    ExpectedImpact,
    ProjectedSavings
)
from app.ml.models import ml_models


class PaymentRecommender:
    """
    Payment recommendation engine
    Optimizes payment allocation across multiple cards
    
    Handles the scenario: User owes $2000 across 3 cards but has only $1000 to pay
    """
    
    def __init__(self):
        """Initialize recommender"""
        self.ml_models = ml_models
    
    def recommend(
        self,
        request: PaymentRecommendationRequest
    ) -> PaymentRecommendationResponse:
        """
        Generate payment recommendations based on optimization goal
        
        Strategies:
        - minimize_interest: Avalanche method (highest APR first)
        - improve_score: Snowball method (highest utilization first)
        - balanced: Hybrid approach using ML + rules
        """
        cards = request.cards
        available_amount = request.available_amount
        goal = request.optimization_goal
        
        # Route to appropriate strategy
        if goal == "minimize_interest":
            recommendations = self.prioritize_by_interest(cards, available_amount)
            strategy = "Avalanche Method: Pay high-interest cards first to minimize interest charges"
        elif goal == "improve_score":
            recommendations = self.prioritize_by_utilization(cards, available_amount)
            strategy = "Credit Score Optimization: Focus on reducing high utilization to improve credit score"
        else:  # balanced
            recommendations = self.balanced_approach(cards, available_amount)
            strategy = "Balanced Approach: Optimize for both interest savings and credit score improvement"
        
        # Calculate projected savings
        projected_savings = self.calculate_projected_savings(cards, recommendations)
        
        return PaymentRecommendationResponse(
            user_id=request.user_id,
            total_amount=available_amount,
            recommendations=recommendations,
            strategy=strategy,
            projected_savings=projected_savings
        )
    
    def prioritize_by_interest(
        self, 
        cards: List[CardData], 
        available_amount: float
    ) -> List[PaymentRecommendation]:
        """
        Avalanche Method: Prioritize highest interest rate cards
        
        Strategy:
        1. Pay minimum on all cards
        2. Put remaining funds toward highest APR card
        3. Continue to next highest APR when first is paid off
        """
        recommendations = []
        remaining_funds = available_amount
        
        # Sort by interest rate (highest first)
        sorted_cards = sorted(
            cards, 
            key=lambda c: c.interest_rate if c.interest_rate else 0, 
            reverse=True
        )
        
        # First pass: Ensure all minimums are covered
        total_minimums = sum(card.minimum_payment for card in cards)
        
        if remaining_funds < total_minimums:
            # Not enough to cover all minimums - prioritize by urgency
            return self._emergency_allocation(cards, remaining_funds)
        
        # Second pass: Allocate remaining funds to highest interest cards
        for priority, card in enumerate(sorted_cards, 1):
            if remaining_funds <= 0:
                # No funds left, just recommend minimum
                suggested_amount = 0
            elif remaining_funds >= card.current_balance:
                # Can pay off entire balance
                suggested_amount = card.current_balance
                remaining_funds -= card.current_balance
            else:
                # Pay minimum + extra from remaining funds
                extra_payment = remaining_funds if priority == 1 else 0
                suggested_amount = min(
                    card.minimum_payment + extra_payment,
                    card.current_balance
                )
                remaining_funds = max(0, remaining_funds - extra_payment)
            
            if suggested_amount > 0:
                impact = self.calculate_impact(card, suggested_amount)
                
                recommendations.append(PaymentRecommendation(
                    card_id=card.card_id,
                    suggested_amount=suggested_amount,
                    reasoning=self._translate(
                        f"Pay ${suggested_amount:.2f} on {card.institution_name} "
                        f"({card.interest_rate:.2f}% APR) to minimize interest charges. "
                        f"This card has the {'highest' if priority == 1 else 'high'} interest rate."
                    ),
                    expected_impact=impact,
                    priority=priority
                ))
        
        return recommendations
    
    def prioritize_by_utilization(
        self, 
        cards: List[CardData], 
        available_amount: float
    ) -> List[PaymentRecommendation]:
        """
        Credit Score Optimization: Prioritize highest utilization cards
        
        Strategy:
        1. Target cards above 30% utilization first
        2. Aim to bring all cards below 30% if possible
        3. Distribute funds to maximize score impact
        """
        recommendations = []
        remaining_funds = available_amount
        
        # Sort cards by utilization (highest first)
        sorted_cards = sorted(
            cards,
            key=lambda c: c.utilization_percentage,
            reverse=True
        )
        
        # Ensure minimums are covered
        total_minimums = sum(card.minimum_payment for card in cards)
        if remaining_funds < total_minimums:
            return self._emergency_allocation(cards, remaining_funds)
        
        # Calculate optimal distribution to reduce high utilization
        for priority, card in enumerate(sorted_cards, 1):
            if remaining_funds <= 0:
                suggested_amount = 0
            else:
                # Calculate amount needed to reach 30% utilization
                target_balance = card.credit_limit * 0.30
                amount_to_target = max(0, card.current_balance - target_balance)
                
                if card.utilization_percentage > 30 and amount_to_target > 0:
                    # Prioritize bringing this card below 30%
                    suggested_amount = min(
                        amount_to_target,
                        remaining_funds,
                        card.current_balance
                    )
                else:
                    # Already below 30%, pay minimum or more if funds available
                    suggested_amount = min(
                        card.minimum_payment,
                        remaining_funds,
                        card.current_balance
                    )
                
                remaining_funds -= suggested_amount
            
            if suggested_amount > 0:
                impact = self.calculate_impact(card, suggested_amount)
                
                reasoning = (
                    f"Pay ${suggested_amount:.2f} on {card.institution_name} "
                    f"(current utilization: {card.utilization_percentage:.1f}%). "
                )
                
                if card.utilization_percentage > 30:
                    new_util = ((card.current_balance - suggested_amount) / card.credit_limit) * 100
                    reasoning += f"This will reduce utilization to {new_util:.1f}%, improving your credit score."
                else:
                    reasoning += "Maintain good standing on this low-utilization card."
                
                recommendations.append(PaymentRecommendation(
                    card_id=card.card_id,
                    suggested_amount=suggested_amount,
                    reasoning=self._translate(reasoning),
                    expected_impact=impact,
                    priority=priority
                ))
        
        return recommendations
    
    def balanced_approach(
        self, 
        cards: List[CardData], 
        available_amount: float
    ) -> List[PaymentRecommendation]:
        """
        Balanced Approach: Use ML model + rules for optimal allocation
        
        Considers both interest rates and utilization
        Uses ML model to predict payment priorities
        """
        recommendations = []
        remaining_funds = available_amount
        
        # Prepare data for ML prediction
        cards_data = []
        for card in cards:
            cards_data.append({
                'card_id': card.card_id,
                'institution_name': card.institution_name,
                'balance': card.current_balance,
                'credit_limit': card.credit_limit,
                'utilization': card.utilization_percentage,
                'interest_rate': card.interest_rate if card.interest_rate else 19.99,
                'minimum_payment': card.minimum_payment,
                'days_until_due': self._calculate_days_until_due(card.payment_due_date)
            })
        
        # Use ML model to prioritize cards
        prioritized_cards = self.ml_models.predict_payment_priority(
            cards_data,
            available_amount
        )
        
        # Ensure minimums are covered
        total_minimums = sum(card.minimum_payment for card in cards)
        if remaining_funds < total_minimums:
            return self._emergency_allocation(cards, remaining_funds)
        
        # Allocate funds based on ML priorities
        for card_data in prioritized_cards:
            if remaining_funds <= 0:
                suggested_amount = 0
            else:
                # Get original card data
                original_card = next(c for c in cards if c.card_id == card_data['card_id'])
                
                # Smart allocation based on priority
                if card_data['priority'] == 1:
                    # Highest priority: allocate maximum available
                    suggested_amount = min(
                        remaining_funds,
                        original_card.current_balance
                    )
                else:
                    # Lower priority: pay minimum or proportional amount
                    proportional = remaining_funds / (len(cards) - card_data['priority'] + 1)
                    suggested_amount = min(
                        max(original_card.minimum_payment, proportional),
                        remaining_funds,
                        original_card.current_balance
                    )
                
                remaining_funds -= suggested_amount
            
            if suggested_amount > 0:
                original_card = next(c for c in cards if c.card_id == card_data['card_id'])
                impact = self.calculate_impact(original_card, suggested_amount)
                
                reasoning = (
                    f"Pay ${suggested_amount:.2f} on {card_data['institution_name']}. "
                    f"This card is priority #{card_data['priority']} based on "
                    f"{card_data['utilization']:.1f}% utilization and "
                    f"{card_data['interest_rate']:.2f}% APR."
                )
                
                recommendations.append(PaymentRecommendation(
                    card_id=card_data['card_id'],
                    suggested_amount=suggested_amount,
                    reasoning=self._translate(reasoning),
                    expected_impact=impact,
                    priority=card_data['priority']
                ))
        
        return recommendations
    
    def _emergency_allocation(
        self, 
        cards: List[CardData], 
        available_amount: float
    ) -> List[PaymentRecommendation]:
        """
        Emergency allocation when funds don't cover all minimums
        
        Prioritize by:
        1. Days until due (most urgent first)
        2. Highest interest rate
        3. Smallest minimum payment (snowball to cover more cards)
        """
        recommendations = []
        remaining_funds = available_amount
        
        # Sort by urgency (days until due, then interest rate)
        sorted_cards = sorted(
            cards,
            key=lambda c: (
                self._calculate_days_until_due(c.payment_due_date),
                -(c.interest_rate if c.interest_rate else 0)
            )
        )
        
        for priority, card in enumerate(sorted_cards, 1):
            if remaining_funds <= 0:
                break
            
            suggested_amount = min(card.minimum_payment, remaining_funds, card.current_balance)
            remaining_funds -= suggested_amount
            
            impact = self.calculate_impact(card, suggested_amount)
            
            recommendations.append(PaymentRecommendation(
                card_id=card.card_id,
                suggested_amount=suggested_amount,
                reasoning=self._translate(
                    f"⚠️ Pay ${suggested_amount:.2f} on {card.institution_name} "
                    f"to avoid late fees. Payment is most urgent on this card."
                ),
                expected_impact=impact,
                priority=priority
            ))
        
        return recommendations
    
    def calculate_impact(
        self,
        card: CardData,
        payment_amount: float
    ) -> ExpectedImpact:
        """
        Calculate expected impact of payment
        
        - Interest saved over 12 months
        - Utilization improvement
        - Estimated credit score impact (simplified)
        """
        # Calculate interest saved
        monthly_rate = (card.interest_rate / 100 / 12) if card.interest_rate else 0.0166
        
        # Interest without extra payment (only minimum)
        balance_with_min = card.current_balance
        interest_with_min = 0
        for month in range(12):
            interest_charge = balance_with_min * monthly_rate
            interest_with_min += interest_charge
            balance_with_min = max(0, balance_with_min + interest_charge - card.minimum_payment)
        
        # Interest with suggested payment
        balance_with_payment = max(0, card.current_balance - payment_amount)
        interest_with_payment = 0
        for month in range(12):
            interest_charge = balance_with_payment * monthly_rate
            interest_with_payment += interest_charge
            balance_with_payment = max(0, balance_with_payment + interest_charge - card.minimum_payment)
        
        interest_saved = max(0, interest_with_min - interest_with_payment)
        
        # Calculate utilization improvement
        current_util = card.utilization_percentage
        new_balance = card.current_balance - payment_amount
        new_util = (new_balance / card.credit_limit) * 100
        utilization_improvement = current_util - new_util
        
        # Estimate score impact (simplified)
        score_impact = 0.0
        if current_util > 70 and new_util <= 70:
            score_impact = 20.0  # Significant improvement
        elif current_util > 50 and new_util <= 50:
            score_impact = 15.0
        elif current_util > 30 and new_util <= 30:
            score_impact = 10.0  # Reaching optimal range
        elif utilization_improvement > 10:
            score_impact = 5.0  # Any meaningful reduction
        
        return ExpectedImpact(
            interest_saved=round(interest_saved, 2),
            utilization_improvement=round(utilization_improvement, 2),
            score_impact_estimate=round(score_impact, 1)
        )
    
    def calculate_projected_savings(
        self,
        cards: List[CardData],
        recommendations: List[PaymentRecommendation]
    ) -> ProjectedSavings:
        """Calculate total projected savings from recommendations"""
        total_interest_saved = sum(
            rec.expected_impact.interest_saved 
            for rec in recommendations
        )
        
        # Monthly is 1/12 of annual projection
        monthly_interest = total_interest_saved / 12
        
        return ProjectedSavings(
            monthly_interest=round(monthly_interest, 2),
            annual_interest=round(total_interest_saved, 2)
        )
    
    def _calculate_days_until_due(self, due_date_str: str) -> int:
        """Calculate days until payment due"""
        if not due_date_str:
            return 999  # Default to far future
        
        try:
            from datetime import datetime
            due_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00'))
            delta = due_date - datetime.now()
            return max(0, delta.days)
        except:
            return 999
    
    def _translate(self, text: str) -> dict:
        """Translate recommendation text"""
        return {
            "en": text,
            "fr": text,  # TODO: Implement French translation
            "ar": text,  # TODO: Implement Arabic translation
        }

