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


class PaymentRecommender:
    """
    Payment recommendation engine
    Optimizes payment allocation across multiple cards
    
    Handles the scenario: User owes $2000 across 3 cards but has only $1000 to pay
    """
    
    def recommend(
        self,
        request: PaymentRecommendationRequest
    ) -> PaymentRecommendationResponse:
        """
        Generate payment recommendations based on optimization goal
        
        Strategies:
        - minimize_interest: Avalanche method (highest APR first)
        - balanced: Hybrid approach using ML + rules
        - minimize_balance: Snowball method (smallest balance first)
        """
        cards = request.cards
        available_amount = request.available_amount
        goal = request.optimization_goal
        
        # Route to appropriate strategy
        if goal == "minimize_interest":
            recommendations = self.prioritize_by_interest(cards, available_amount)
            strategy = "Avalanche Method: Pay high-interest cards first to minimize interest charges"
        elif goal == "minimize_balance":
            recommendations = self.prioritize_by_balance(cards, available_amount)
            strategy = "Snowball Method: Pay smallest balances first for quick wins and motivation"
        else:  # balanced
            recommendations = self.balanced_approach(cards, available_amount)
            strategy = "Balanced Approach: Optimize interest savings with due-date and utilization awareness"
        
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
        Avalanche Method: Pay minimums on ALL cards first, then put all
        extra funds into the highest-APR card (then next highest, etc.)
        """
        total_minimums = sum(card.minimum_payment for card in cards)
        if available_amount < total_minimums:
            return self._emergency_allocation(cards, available_amount)

        # Step 1: Allocate minimums to every card
        allocated = {card.card_id: min(card.minimum_payment, card.current_balance) for card in cards}
        remaining = available_amount - sum(allocated.values())

        # Step 2: Avalanche  extra goes to highest APR first, then next, etc.
        sorted_cards = sorted(cards, key=lambda c: c.interest_rate or 0, reverse=True)
        for card in sorted_cards:
            if remaining <= 0:
                break
            headroom = card.current_balance - allocated[card.card_id]
            if headroom > 0:
                extra = min(remaining, headroom)
                allocated[card.card_id] += extra
                remaining -= extra

        return self._build_recommendations_from_allocation(cards, allocated)
    
    def prioritize_by_balance(
        self,
        cards: List[CardData],
        available_amount: float
    ) -> List[PaymentRecommendation]:
        """
        Snowball Method: Pay minimums on ALL cards first, then put all
        extra funds into the smallest balance card first. Paying off
        cards completely gives a psychological win and reduces the number
        of active debts quickly.
        """
        total_minimums = sum(card.minimum_payment for card in cards)
        if available_amount < total_minimums:
            return self._emergency_allocation(cards, available_amount)

        # Step 1: Allocate minimums to every card
        allocated = {card.card_id: min(card.minimum_payment, card.current_balance) for card in cards}
        remaining = available_amount - sum(allocated.values())

        # Step 2: Snowball — extra goes to smallest balance first
        sorted_cards = sorted(cards, key=lambda c: c.current_balance)
        for card in sorted_cards:
            if remaining <= 0:
                break
            headroom = card.current_balance - allocated[card.card_id]
            if headroom > 0:
                extra = min(remaining, headroom)
                allocated[card.card_id] += extra
                remaining -= extra

        # Build recommendations sorted by balance ascending so priority 1 = smallest
        sorted_for_display = sorted(cards, key=lambda c: c.current_balance)
        recommendations = []
        for priority, card in enumerate(sorted_for_display, 1):
            suggested_amount = round(allocated.get(card.card_id, 0), 2)
            if suggested_amount <= 0:
                continue

            new_balance = max(0, card.current_balance - suggested_amount)
            new_util = (new_balance / card.credit_limit * 100) if card.credit_limit else 0
            days = self._calculate_days_until_due(card.payment_due_date)
            min_pay = card.minimum_payment or 0
            apr = card.interest_rate or 0

            parts = []

            if suggested_amount >= card.current_balance:
                parts.append(
                    f"This is your smallest balance card — paying it off completely "
                    f"eliminates one debt entirely, giving you a quick win and freeing "
                    f"up your minimum payment for other cards."
                )
            else:
                parts.append(
                    f"Paying ${suggested_amount:.2f} reduces this balance from "
                    f"${card.current_balance:.2f} to ${new_balance:.2f} "
                    f"({card.utilization_percentage:.0f}% \u2192 {new_util:.0f}% utilization)."
                )

            if days <= 0:
                parts.append("Your payment is overdue — pay as soon as possible.")
            elif days <= 7:
                parts.append(f"Due in {days} day{'s' if days != 1 else ''} — pay now to avoid a late fee.")

            if min_pay > 0 and suggested_amount > min_pay and suggested_amount < card.current_balance:
                extra = suggested_amount - min_pay
                parts.append(
                    f"This is ${extra:.2f} above your minimum of ${min_pay:.2f}."
                )

            if apr > 0:
                parts.append(f"APR: {apr:.2f}%.")

            impact = self.calculate_impact(card, suggested_amount)
            recommendations.append(PaymentRecommendation(
                card_id=card.card_id,
                suggested_amount=suggested_amount,
                reasoning=self._translate(" ".join(parts)),
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
        Balanced Approach: Pay minimums on ALL cards first, then distribute
        the remaining funds proportionally. Each card's share is weighted by
        APR (higher = more), urgency (sooner due date = more), and utilization
        (higher = more). No card is left with just $0 when funds are available.
        """
        total_minimums = sum(card.minimum_payment for card in cards)
        if available_amount < total_minimums:
            return self._emergency_allocation(cards, available_amount)

        # Step 1: Guarantee minimums on every card
        allocated = {card.card_id: min(card.minimum_payment, card.current_balance) for card in cards}
        remaining = available_amount - sum(allocated.values())

        if remaining <= 0:
            return self._build_recommendations_from_allocation(cards, allocated)

        # Step 2: Score each card for the extra allocation
        # Urgency multiplier: exponential ramp for cards due within 30 days
        scores = {}
        for card in cards:
            headroom = card.current_balance - allocated[card.card_id]
            if headroom <= 0:
                scores[card.card_id] = 0.0
                continue
            days = self._calculate_days_until_due(card.payment_due_date)
            if days <= 0:
                urgency = 5.0   # overdue
            elif days <= 7:
                urgency = 3.0
            elif days <= 14:
                urgency = 2.0
            elif days <= 30:
                urgency = 1.5
            else:
                urgency = 1.0
            apr = card.interest_rate or 19.99
            util = card.utilization_percentage or 0
            scores[card.card_id] = (apr / 100) * urgency * (1 + util / 100)

        total_score = sum(scores.values())

        # Step 3: Distribute remaining proportionally
        if total_score > 0:
            for card in cards:
                headroom = card.current_balance - allocated[card.card_id]
                if headroom <= 0 or scores[card.card_id] <= 0:
                    continue
                share = (scores[card.card_id] / total_score) * remaining
                extra = min(round(share, 2), headroom)
                allocated[card.card_id] = round(allocated[card.card_id] + extra, 2)

        return self._build_recommendations_from_allocation(cards, allocated)

    def _build_recommendations_from_allocation(
        self,
        cards: List[CardData],
        allocated: dict
    ) -> List[PaymentRecommendation]:
        """
        Build PaymentRecommendation list from a {card_id: amount} dict.
        Sorts cards by APR descending so highest-cost debt is priority 1.
        """
        sorted_cards = sorted(
            cards,
            key=lambda c: (-(c.interest_rate or 0), self._calculate_days_until_due(c.payment_due_date))
        )
        recommendations = []
        for priority, card in enumerate(sorted_cards, 1):
            suggested_amount = round(allocated.get(card.card_id, 0), 2)
            if suggested_amount <= 0:
                continue

            new_balance = max(0, card.current_balance - suggested_amount)
            new_util = (new_balance / card.credit_limit * 100) if card.credit_limit else 0
            days = self._calculate_days_until_due(card.payment_due_date)
            apr = card.interest_rate or 0
            min_pay = card.minimum_payment or 0

            parts = []

            # Why this card was chosen
            if priority == 1 and apr > 0:
                parts.append(
                    f"This is your highest-interest card at {apr:.2f}% APR, "
                    f"so putting money here saves you the most in interest charges."
                )
            elif apr > 0:
                parts.append(f"This card carries a {apr:.2f}% annual interest rate.")

            # What the payment does
            if suggested_amount >= card.current_balance:
                parts.append(
                    f"This payment of ${suggested_amount:.2f} clears the full balance "
                    f" the card will be completely paid off."
                )
            else:
                parts.append(
                    f"Paying ${suggested_amount:.2f} reduces your balance from "
                    f"${card.current_balance:.2f} to ${new_balance:.2f} "
                    f"({card.utilization_percentage:.0f}% \u2192 {new_util:.0f}% of your limit used)."
                )

            # Due-date urgency
            if days <= 0:
                parts.append(
                    "Your payment is overdue. Pay as soon as possible to avoid "
                    "late fees and protect your credit score."
                )
            elif days <= 7:
                parts.append(
                    f"This card is due in {days} day{'s' if days != 1 else ''}. "
                    f"Paying now avoids a late fee."
                )
            elif days <= 14:
                parts.append(
                    f"Your due date is in {days} days  you have a bit of time, but don't wait too long."
                )

            # Minimum payment context
            if min_pay > 0 and suggested_amount < card.current_balance:
                if suggested_amount > min_pay:
                    extra = suggested_amount - min_pay
                    parts.append(
                        f"This is ${extra:.2f} above your minimum payment of ${min_pay:.2f}, "
                        f"which means less interest will build up next month."
                    )
                elif abs(suggested_amount - min_pay) < 0.01:
                    parts.append(
                        f"This covers your required minimum of ${min_pay:.2f} and keeps your account in good standing."
                    )

            reasoning_text = " ".join(parts)

            impact = self.calculate_impact(card, suggested_amount)
            recommendations.append(PaymentRecommendation(
                card_id=card.card_id,
                suggested_amount=suggested_amount,
                reasoning=self._translate(reasoning_text),
                expected_impact=impact,
                priority=priority
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
            remaining_days = self._calculate_days_until_due(card.payment_due_date)

            impact = self.calculate_impact(card, suggested_amount)

            if remaining_days <= 0:
                due_note = "This payment is already overdue  pay immediately."
            elif remaining_days <= 3:
                due_note = f"Only {remaining_days} day{'s' if remaining_days != 1 else ''} left before the due date."
            else:
                due_note = f"Due in {remaining_days} days."

            reasoning_text = (
                f"Your budget is tight this month, so we're covering the most urgent cards first. "
                f"Paying ${suggested_amount:.2f} on {card.institution_name} meets your minimum payment "
                f"and keeps your account in good standing. {due_note}"
            )

            recommendations.append(PaymentRecommendation(
                card_id=card.card_id,
                suggested_amount=suggested_amount,
                reasoning=self._translate(reasoning_text),
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
        
        return ExpectedImpact(
            interest_saved=round(interest_saved, 2),
            utilization_improvement=round(utilization_improvement, 2)
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

