"""
Transaction Insight Generator
Generates insights for individual transactions
"""

from typing import Dict, List, Optional
from datetime import datetime, timedelta


class TransactionInsightGenerator:
    """Generate insights for transaction data"""
    
    def __init__(self):
        """Initialize insight generator"""
        pass
    
    def generate_transaction_insight(
        self,
        transaction: Dict,
        card_context: Dict
    ) -> Dict:
        """
        Generate insight for a single transaction
        
        Args:
            transaction: {amount, category, date, merchant, ...}
            card_context: {current_balance, credit_limit, utilization, payment_due_date, ...}
        
        Returns:
            {insight_type, message, severity, metadata}
        """
        insights = []
        
        # Calculate remaining credit before 30% threshold
        thirty_percent_threshold = card_context['credit_limit'] * 0.30
        current_balance = card_context.get('current_balance', 0)
        remaining_to_30_percent = thirty_percent_threshold - current_balance
        
        # Insight 1: Spending room before 30% utilization
        if current_balance < thirty_percent_threshold:
            if remaining_to_30_percent <= 100:
                insights.append({
                    'type': 'utilization_warning',
                    'severity': 'high',
                    'message': {
                        'en': f'You have ${remaining_to_30_percent:.2f} left before reaching 30% utilization (optimal for credit score)',
                        'fr': f'Il vous reste {remaining_to_30_percent:.2f}$ avant d\'atteindre 30% d\'utilisation (optimal pour votre cote de crédit)',
                        'ar': f'لديك {remaining_to_30_percent:.2f}$ متبقية قبل الوصول إلى 30% استخدام (الأمثل لدرجة الائتمان)'
                    },
                    'metadata': {
                        'remaining_amount': remaining_to_30_percent,
                        'threshold_percentage': 30,
                        'current_utilization': card_context.get('utilization', 0)
                    }
                })
        
        # Insight 2: Category spending patterns
        if transaction.get('category'):
            category_insight = self._get_category_insight(
                transaction['category'],
                transaction['amount'],
                card_context
            )
            if category_insight:
                insights.append(category_insight)
        
        # Insight 3: High utilization warning
        current_utilization = card_context.get('utilization', 0)
        if current_utilization > 70:
            insights.append({
                'type': 'high_utilization_alert',
                'severity': 'urgent',
                'message': {
                    'en': f'⚠️ High utilization ({current_utilization:.1f}%). Consider paying down your balance to improve your credit score.',
                    'fr': f'⚠️ Utilisation élevée ({current_utilization:.1f}%). Envisagez de rembourser votre solde pour améliorer votre cote de crédit.',
                    'ar': f'⚠️ استخدام مرتفع ({current_utilization:.1f}%). فكر في سداد رصيدك لتحسين درجة الائتمان الخاصة بك.'
                },
                'metadata': {
                    'current_utilization': current_utilization,
                    'recommended_target': 30
                }
            })
        elif current_utilization > 50:
            insights.append({
                'type': 'moderate_utilization_warning',
                'severity': 'medium',
                'message': {
                    'en': f'Your utilization is at {current_utilization:.1f}%. Keeping it below 30% is ideal for your credit score.',
                    'fr': f'Votre utilisation est de {current_utilization:.1f}%. La maintenir en dessous de 30% est idéal pour votre cote de crédit.',
                    'ar': f'استخدامك عند {current_utilization:.1f}%. الحفاظ عليه أقل من 30% مثالي لدرجة الائتمان الخاصة بك.'
                },
                'metadata': {
                    'current_utilization': current_utilization,
                    'recommended_target': 30
                }
            })
        
        # Insight 4: Payment due date proximity
        if card_context.get('payment_due_date'):
            due_date_insight = self._get_due_date_insight(card_context)
            if due_date_insight:
                insights.append(due_date_insight)
        
        # Return the most relevant insight (or all if needed)
        return insights[0] if insights else None
    
    def _get_category_insight(
        self,
        category: str,
        amount: float,
        card_context: Dict
    ) -> Optional[Dict]:
        """Generate category-specific insights"""
        
        # Example: Large dining transaction
        if category == 'Dining' and amount > 100:
            return {
                'type': 'spending_pattern',
                'severity': 'info',
                'message': {
                    'en': f'Large dining expense: ${amount:.2f}. This is above your typical dining spend.',
                    'fr': f'Dépense importante en restauration: {amount:.2f}$. C\'est au-dessus de vos dépenses habituelles.',
                    'ar': f'نفقات طعام كبيرة: {amount:.2f}$. هذا أعلى من إنفاقك المعتاد على الطعام.'
                },
                'metadata': {
                    'category': category,
                    'amount': amount
                }
            }
        
        # Example: High shopping spend
        if category == 'Shopping' and amount > 200:
            return {
                'type': 'spending_pattern',
                'severity': 'info',
                'message': {
                    'en': f'Significant shopping purchase: ${amount:.2f}. Monitor your balance to stay within budget.',
                    'fr': f'Achat important: {amount:.2f}$. Surveillez votre solde pour rester dans votre budget.',
                    'ar': f'عملية شراء كبيرة: {amount:.2f}$. راقب رصيدك للبقاء ضمن الميزانية.'
                },
                'metadata': {
                    'category': category,
                    'amount': amount
                }
            }
        
        return None
    
    def _get_due_date_insight(self, card_context: Dict) -> Optional[Dict]:
        """Generate payment due date insights"""
        try:
            due_date_str = card_context['payment_due_date']
            if not due_date_str:
                return None
            
            due_date = datetime.fromisoformat(due_date_str.replace('Z', '+00:00'))
            days_until_due = (due_date - datetime.now()).days
            
            min_payment = card_context.get('minimum_payment', 0)
            
            if days_until_due <= 3 and days_until_due >= 0:
                return {
                    'type': 'payment_due_urgent',
                    'severity': 'urgent',
                    'message': {
                        'en': f'⚠️ Payment due in {days_until_due} days! Minimum payment: ${min_payment:.2f}',
                        'fr': f'⚠️ Paiement dû dans {days_until_due} jours! Paiement minimum: {min_payment:.2f}$',
                        'ar': f'⚠️ الدفع مستحق خلال {days_until_due} أيام! الحد الأدنى للدفع: {min_payment:.2f}$'
                    },
                    'metadata': {
                        'days_until_due': days_until_due,
                        'minimum_payment': min_payment
                    }
                }
            elif days_until_due <= 7 and days_until_due >= 0:
                return {
                    'type': 'payment_due_soon',
                    'severity': 'high',
                    'message': {
                        'en': f'Payment due in {days_until_due} days. Minimum payment: ${min_payment:.2f}',
                        'fr': f'Paiement dû dans {days_until_due} jours. Paiement minimum: {min_payment:.2f}$',
                        'ar': f'الدفع مستحق خلال {days_until_due} أيام. الحد الأدنى للدفع: {min_payment:.2f}$'
                    },
                    'metadata': {
                        'days_until_due': days_until_due,
                        'minimum_payment': min_payment
                    }
                }
        except Exception as e:
            print(f"Error parsing due date: {e}")
            return None
        
        return None
    
    def analyze_spending_by_category(
        self,
        transactions: List[Dict]
    ) -> Dict[str, float]:
        """
        Analyze total spending by category
        
        Returns: {category: total_amount}
        """
        category_totals = {}
        
        for txn in transactions:
            category = txn.get('category', 'Other')
            amount = txn.get('amount', 0)
            
            if category in category_totals:
                category_totals[category] += amount
            else:
                category_totals[category] = amount
        
        return category_totals
    
    def generate_spending_summary_insight(
        self,
        category_totals: Dict[str, float],
        total_spending: float
    ) -> List[Dict]:
        """Generate insights about spending distribution"""
        insights = []
        
        # Find top categories
        sorted_categories = sorted(
            category_totals.items(),
            key=lambda x: x[1],
            reverse=True
        )
        
        if sorted_categories:
            top_category, top_amount = sorted_categories[0]
            percentage = (top_amount / total_spending * 100) if total_spending > 0 else 0
            
            insights.append({
                'type': 'spending_distribution',
                'severity': 'info',
                'message': {
                    'en': f'Your top spending category is {top_category} (${top_amount:.2f}, {percentage:.1f}% of total)',
                    'fr': f'Votre principale catégorie de dépenses est {top_category} ({top_amount:.2f}$, {percentage:.1f}% du total)',
                    'ar': f'أعلى فئة إنفاق لديك هي {top_category} ({top_amount:.2f}$، {percentage:.1f}% من الإجمالي)'
                },
                'metadata': {
                    'top_category': top_category,
                    'amount': top_amount,
                    'percentage': percentage
                }
            })
        
        return insights


# Global instance
transaction_insights = TransactionInsightGenerator()
