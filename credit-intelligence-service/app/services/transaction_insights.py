"""
Transaction Insight Generator
Generates insights for individual transactions
"""

from typing import Dict, List, Optional
from datetime import datetime


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

        # Insight 1: Category spending patterns
        if transaction.get('category'):
            category_insight = self._get_category_insight(
                transaction['category'],
                transaction['amount'],
                card_context
            )
            if category_insight:
                insights.append(category_insight)

        # Insight 2: Payment due date proximity
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
        """Generate a descriptive, non-heuristic category insight."""
        normalized_category = (category or '').strip()
        if not normalized_category:
            return None

        return {
            'type': 'transaction_category',
            'severity': 'info',
            'message': {
                'en': f'Transaction categorized as {normalized_category} with amount ${amount:.2f}.',
                'fr': f'Transaction classée dans la catégorie {normalized_category} pour un montant de {amount:.2f}$.',
                'ar': f'تم تصنيف المعاملة ضمن فئة {normalized_category} بمبلغ {amount:.2f}$.'
            },
            'metadata': {
                'category': normalized_category,
                'amount': amount
            }
        }
    
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
