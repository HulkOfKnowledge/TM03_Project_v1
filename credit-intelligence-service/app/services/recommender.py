"""
Payment Recommender Service
Generates optimized payment allocation strategies
"""

from typing import List
from app.models.schemas import (
    PaymentRecommendationRequest,
    PaymentRecommendationResponse,
    PaymentRecommendation,
    CardData,
    ExpectedImpact,
    ProjectedSavings
)


class PaymentRecommender:
    """
    Payment recommendation engine
    Optimizes payment allocation across multiple cards
    """
    
    def __init__(self):
        """Initialize recommender"""
        pass
    
    def recommend(
        self,
        request: PaymentRecommendationRequest
    ) -> PaymentRecommendationResponse:
        """
        Generate payment recommendations
        
        TODO: Implement recommendation logic based on optimization goal:
        
        minimize_interest:
        - Prioritize highest interest rate cards
        - Pay minimums on others, extra to highest APR
        - Calculate interest savings
        
        improve_score:
        - Prioritize highest utilization cards
        - Aim to get all cards below 30% utilization
        - Balance across cards if possible
        
        balanced:
        - Hybrid approach
        - Target high utilization AND high interest
        - Weighted scoring system
        """
        cards = request.cards
        available_amount = request.available_amount

        if not cards:
            return PaymentRecommendationResponse(
                user_id=request.user_id,
                total_amount=0.0,
                recommendations=[],
                strategy=request.optimization_goal,
                projected_savings=ProjectedSavings(
                    monthly_interest=0.0,
                    annual_interest=0.0,
                ),
            )

        minimum_total = sum(card.minimum_payment for card in cards)
        total_balance = sum(card.current_balance for card in cards)
        
        # Handle edge cases
        # Case 1: Budget is less than minimum payments - allocate proportionally
        # Case 2: Budget exceeds total balance - pay off all cards
        if available_amount < minimum_total:
            # Insufficient to cover minimums - allocate proportionally to avoid all late fees equally
            ratio = available_amount / minimum_total if minimum_total > 0 else 0
            recommendations: List[PaymentRecommendation] = []
            for index, card in enumerate(cards, start=1):
                suggested_amount = card.minimum_payment * ratio
                impact = self.calculate_impact(card, suggested_amount)
                reasoning = (
                    f"Pay ${suggested_amount:.2f} (partial payment) • "
                    f"Budget insufficient to cover minimum (${card.minimum_payment:.2f}) • "
                    f"May incur late fees. Consider increasing budget to ${minimum_total:.2f}"
                )
                recommendations.append(
                    PaymentRecommendation(
                        card_id=card.card_id,
                        suggested_amount=round(suggested_amount, 2),
                        reasoning={"en": reasoning, "fr": reasoning, "ar": reasoning},
                        expected_impact=impact,
                        priority=index,
                    )
                )
            projected = self.calculate_projected_savings(cards, recommendations)
            return PaymentRecommendationResponse(
                user_id=request.user_id,
                total_amount=round(available_amount, 2),
                recommendations=recommendations,
                strategy=request.optimization_goal,
                projected_savings=projected,
            )
        
        # Case 2: Budget exceeds total balance - pay off everything
        if available_amount >= total_balance:
            recommendations: List[PaymentRecommendation] = []
            for index, card in enumerate(cards, start=1):
                suggested_amount = card.current_balance
                impact = self.calculate_impact(card, suggested_amount)
                reasoning = (
                    f"Pay ${suggested_amount:.2f} (full balance) • "
                    f"This will pay off {card.institution_name} completely • "
                    f"Card will have $0 balance"
                )
                recommendations.append(
                    PaymentRecommendation(
                        card_id=card.card_id,
                        suggested_amount=round(suggested_amount, 2),
                        reasoning={"en": reasoning, "fr": reasoning, "ar": reasoning},
                        expected_impact=impact,
                        priority=index,
                    )
                )
            projected = self.calculate_projected_savings(cards, recommendations)
            return PaymentRecommendationResponse(
                user_id=request.user_id,
                total_amount=round(total_balance, 2),
                recommendations=recommendations,
                strategy=request.optimization_goal,
                projected_savings=projected,
            )
        
        # Normal case: Budget covers minimums but less than total balance
        extra_pool = max(0.0, available_amount - minimum_total)

        if request.optimization_goal == "minimize_interest":
            priority_cards = sorted(
                cards, key=lambda c: c.interest_rate or 0, reverse=True
            )
        elif request.optimization_goal == "improve_score":
            priority_cards = sorted(
                cards, key=lambda c: c.utilization_percentage, reverse=True
            )
        else:
            priority_cards = sorted(
                cards,
                key=lambda c: (c.utilization_percentage * 0.6) + ((c.interest_rate or 0) * 0.4),
                reverse=True,
            )

        recommendations: List[PaymentRecommendation] = []
        remaining = extra_pool

        for index, card in enumerate(priority_cards, start=1):
            extra_payment = min(remaining, max(0.0, card.current_balance - card.minimum_payment))
            suggested_amount = max(card.minimum_payment, card.minimum_payment + extra_payment)
            suggested_amount = min(suggested_amount, card.current_balance)
            remaining = max(0.0, remaining - extra_payment)

            impact = self.calculate_impact(card, suggested_amount)
            
            # Generate contextual reasoning based on optimization goal and card details
            reasoning = self._generate_reasoning(
                card, suggested_amount, extra_payment, request.optimization_goal, impact
            )

            recommendations.append(
                PaymentRecommendation(
                    card_id=card.card_id,
                    suggested_amount=round(suggested_amount, 2),
                    reasoning={"en": reasoning, "fr": reasoning, "ar": reasoning},
                    expected_impact=impact,
                    priority=index,
                )
            )

        projected = self.calculate_projected_savings(cards, recommendations)

        return PaymentRecommendationResponse(
            user_id=request.user_id,
            total_amount=round(minimum_total + extra_pool, 2),
            recommendations=recommendations,
            strategy=request.optimization_goal,
            projected_savings=projected,
        )
    
    def prioritize_by_interest(self, cards: List[CardData]) -> List[PaymentRecommendation]:
        """
        Prioritize payments to minimize interest
        
        TODO: Implementation
        - Sort cards by interest rate (highest first)
        - Allocate available amount optimally
        - Calculate interest savings vs minimum payment only
        """
        sorted_cards = sorted(cards, key=lambda c: c.interest_rate or 0, reverse=True)
        return [
            PaymentRecommendation(
                card_id=card.card_id,
                suggested_amount=card.minimum_payment,
                reasoning={
                    "en": f"Cover minimum on {card.institution_name}.",
                    "fr": f"Cover minimum on {card.institution_name}.",
                    "ar": f"Cover minimum on {card.institution_name}.",
                },
                expected_impact=self.calculate_impact(card, card.minimum_payment),
                priority=index + 1,
            )
            for index, card in enumerate(sorted_cards)
        ]
    
    def prioritize_by_utilization(self, cards: List[CardData]) -> List[PaymentRecommendation]:
        """
        Prioritize payments to improve credit score
        
        TODO: Implementation
        - Sort cards by utilization (highest first)
        - Target 30% threshold
        - Balance across cards for best score impact
        """
        sorted_cards = sorted(cards, key=lambda c: c.utilization_percentage, reverse=True)
        return [
            PaymentRecommendation(
                card_id=card.card_id,
                suggested_amount=card.minimum_payment,
                reasoning={
                    "en": f"Reduce utilization on {card.institution_name}.",
                    "fr": f"Reduce utilization on {card.institution_name}.",
                    "ar": f"Reduce utilization on {card.institution_name}.",
                },
                expected_impact=self.calculate_impact(card, card.minimum_payment),
                priority=index + 1,
            )
            for index, card in enumerate(sorted_cards)
        ]
    
    def calculate_impact(
        self,
        card: CardData,
        payment_amount: float
    ) -> ExpectedImpact:
        """
        Calculate expected impact of payment
        
        TODO: Implementation
        - Calculate interest saved over 12 months
        - Calculate utilization improvement
        - Estimate credit score impact (simplified)
        """
        monthly_interest = (card.interest_rate or 0) / 100 / 12 * card.current_balance
        interest_saved = min(monthly_interest, payment_amount * 0.3)
        utilization_improvement = (
            payment_amount / card.credit_limit * 100 if card.credit_limit > 0 else 0.0
        )
        score_impact = min(5.0, utilization_improvement * 0.15)

        return ExpectedImpact(
            interest_saved=round(interest_saved, 2),
            utilization_improvement=round(utilization_improvement, 2),
            score_impact_estimate=round(score_impact, 2)
        )
    
    def calculate_projected_savings(
        self,
        cards: List[CardData],
        recommendations: List[PaymentRecommendation]
    ) -> ProjectedSavings:
        """
        Calculate total projected savings
        
        TODO: Implementation
        - Sum interest saved across all cards
        - Monthly and annual projections
        """
        monthly_interest = sum(
            rec.expected_impact.interest_saved for rec in recommendations
        )
        return ProjectedSavings(
            monthly_interest=round(monthly_interest, 2),
            annual_interest=round(monthly_interest * 12, 2)
        )
    
    def _generate_reasoning(
        self,
        card: CardData,
        suggested_amount: float,
        extra_payment: float,
        optimization_goal: str,
        impact: ExpectedImpact
    ) -> str:
        """Generate contextual reasoning for payment recommendation"""
        
        # Calculate new utilization after payment
        new_balance = card.current_balance - suggested_amount
        new_utilization = (new_balance / card.credit_limit * 100) if card.credit_limit > 0 else 0
        
        # Base information
        parts = []
        
        if extra_payment > 0:
            parts.append(f"Pay ${suggested_amount:.2f} (${card.minimum_payment:.2f} min + ${extra_payment:.2f} extra)")
        else:
            parts.append(f"Pay ${suggested_amount:.2f} (minimum payment)")
        
        # Add context based on optimization goal
        if optimization_goal == "minimize_interest":
            if card.interest_rate and card.interest_rate > 0:
                parts.append(f"This card has {card.interest_rate:.1f}% APR (highest interest rate)")
                if impact.interest_saved > 0:
                    parts.append(f"Saves ${impact.interest_saved:.2f}/month in interest charges")
        
        elif optimization_goal == "improve_score":
            parts.append(f"Current utilization: {card.utilization_percentage:.1f}%")
            if extra_payment > 0:
                parts.append(f"Will reduce to {new_utilization:.1f}%")
                if card.utilization_percentage > 30:
                    parts.append("Getting closer to ideal 30% threshold")
        
        else:  # balanced
            reasons = []
            if card.utilization_percentage > 50:
                reasons.append(f"high utilization ({card.utilization_percentage:.1f}%)")
            if card.interest_rate and card.interest_rate > 15:
                reasons.append(f"high APR ({card.interest_rate:.1f}%)")
            
            if reasons:
                parts.append(f"Priority due to: {', '.join(reasons)}")
            
            if extra_payment > 0 and impact.interest_saved > 0:
                parts.append(f"Saves ${impact.interest_saved:.2f}/month, improves utilization by {impact.utilization_improvement:.1f}%")
        
        return " • ".join(parts)
