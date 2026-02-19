"""
Training Data Generator
Generates synthetic data for training credit intelligence models
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Tuple
import random


class CreditDataGenerator:
    """Generate synthetic credit card data for training"""
    
    CATEGORIES = [
        'Groceries', 'Gas', 'Dining', 'Shopping', 'Entertainment', 
        'Bills', 'Healthcare', 'Travel', 'Education', 'Other'
    ]
    
    MERCHANTS = {
        'Groceries': ['Walmart', 'Sobeys', 'Loblaws', 'Metro', 'Costco'],
        'Gas': ['Shell', 'Esso', 'Petro-Canada', 'Irving', 'Ultramar'],
        'Dining': ['Tim Hortons', 'McDonald\'s', 'Restaurant', 'Subway', 'Pizza Place'],
        'Shopping': ['Amazon', 'Winners', 'Sport Chek', 'Best Buy', 'The Bay'],
        'Entertainment': ['Netflix', 'Spotify', 'Cineplex', 'iTunes', 'Steam'],
        'Bills': ['Bell', 'Rogers', 'NB Power', 'Insurance Co', 'Internet Provider'],
        'Healthcare': ['Pharmacy', 'Dental Clinic', 'Hospital', 'Vision Care', 'Clinic'],
        'Travel': ['Air Canada', 'Hotel', 'Uber', 'Transit', 'Gas Station'],
        'Education': ['Amazon Books', 'Staples', 'University', 'Online Course', 'Bookstore'],
        'Other': ['General Store', 'Service', 'Subscription', 'Misc', 'Other'],
    }
    
    def __init__(self, seed: int = 42):
        """Initialize generator with random seed"""
        np.random.seed(seed)
        random.seed(seed)
    
    def generate_transaction_data(self, n_users: int = 500, n_months: int = 12) -> pd.DataFrame:
        """
        Generate synthetic transaction data
        
        Returns DataFrame with columns:
        - user_id, card_id, transaction_date, amount, category, merchant
        - is_recurring (bill/subscription), day_of_month, utilization_at_transaction
        """
        transactions = []
        
        for user_id in range(1, n_users + 1):
            # User profile
            n_cards = np.random.choice([1, 2, 3], p=[0.5, 0.35, 0.15])
            spending_level = np.random.choice(['low', 'medium', 'high'], p=[0.3, 0.5, 0.2])
            
            for card_id in range(1, n_cards + 1):
                # Card profile
                credit_limit = np.random.choice([1000, 2000, 5000, 10000], p=[0.2, 0.4, 0.3, 0.1])
                
                # Generate monthly transactions
                for month in range(n_months):
                    month_transactions = self._generate_monthly_transactions(
                        user_id, card_id, month, credit_limit, spending_level
                    )
                    transactions.extend(month_transactions)
        
        df = pd.DataFrame(transactions)
        return df
    
    def _generate_monthly_transactions(
        self, 
        user_id: int, 
        card_id: int, 
        month_offset: int,
        credit_limit: float,
        spending_level: str
    ) -> List[Dict]:
        """Generate transactions for one month"""
        base_date = datetime.now() - timedelta(days=month_offset * 30)
        transactions = []
        current_balance = 0
        
        # Monthly spending based on profile
        spending_multipliers = {'low': 0.15, 'medium': 0.35, 'high': 0.65}
        target_spending = credit_limit * spending_multipliers[spending_level]
        target_spending *= np.random.uniform(0.8, 1.2)  # Add variance
        
        # Generate recurring bills (same day each month)
        recurring_categories = ['Bills', 'Entertainment']
        for category in recurring_categories:
            if np.random.random() < 0.7:  # 70% chance of having this recurring charge
                amount = np.random.uniform(50, 200)
                day = np.random.randint(1, 28)
                merchant = np.random.choice(self.MERCHANTS[category])
                
                txn_date = base_date.replace(day=min(day, 28))
                current_balance += amount
                
                transactions.append({
                    'user_id': f'user_{user_id}',
                    'card_id': f'card_{user_id}_{card_id}',
                    'transaction_date': txn_date,
                    'amount': round(amount, 2),
                    'category': category,
                    'merchant': merchant,
                    'is_recurring': True,
                    'day_of_month': day,
                    'utilization_at_transaction': round((current_balance / credit_limit) * 100, 2),
                    'credit_limit': credit_limit
                })
        
        # Generate regular transactions
        remaining_budget = target_spending - current_balance
        n_transactions = np.random.randint(8, 25)
        
        for _ in range(n_transactions):
            if current_balance >= target_spending:
                break
            
            # Category distribution (weighted)
            category_weights = {
                'Groceries': 0.25, 'Gas': 0.15, 'Dining': 0.20, 'Shopping': 0.15,
                'Entertainment': 0.05, 'Bills': 0.05, 'Healthcare': 0.05,
                'Travel': 0.05, 'Education': 0.03, 'Other': 0.02
            }
            category = np.random.choice(list(category_weights.keys()), p=list(category_weights.values()))
            
            # Amount based on category
            amount_ranges = {
                'Groceries': (30, 150), 'Gas': (40, 80), 'Dining': (15, 60),
                'Shopping': (20, 200), 'Entertainment': (10, 50), 'Bills': (50, 200),
                'Healthcare': (20, 150), 'Travel': (50, 500), 'Education': (20, 300),
                'Other': (10, 100)
            }
            min_amt, max_amt = amount_ranges[category]
            amount = np.random.uniform(min_amt, max_amt)
            
            # Random day in month
            day = np.random.randint(1, 28)
            txn_date = base_date.replace(day=day)
            merchant = np.random.choice(self.MERCHANTS[category])
            
            current_balance += amount
            
            transactions.append({
                'user_id': f'user_{user_id}',
                'card_id': f'card_{user_id}_{card_id}',
                'transaction_date': txn_date,
                'amount': round(amount, 2),
                'category': category,
                'merchant': merchant,
                'is_recurring': False,
                'day_of_month': day,
                'utilization_at_transaction': round((current_balance / credit_limit) * 100, 2),
                'credit_limit': credit_limit
            })
        
        return transactions
    
    def generate_payment_priority_data(self, n_scenarios: int = 1000) -> pd.DataFrame:
        """
        Generate training data for payment prioritization
        
        For scenarios where user has limited funds to pay across multiple cards
        Features: utilization, interest_rate, minimum_payment, days_until_due, balance
        Target: payment_priority (1=highest, 2=medium, 3=lowest)
        """
        scenarios = []
        
        for _ in range(n_scenarios):
            # Generate 2-4 cards for this scenario
            n_cards = np.random.randint(2, 5)
            available_funds = np.random.uniform(500, 3000)
            total_owed = available_funds * np.random.uniform(1.5, 3.5)  # Always owe more than available
            
            cards = []
            for card_idx in range(n_cards):
                credit_limit = np.random.choice([1000, 2000, 5000, 10000])
                balance = np.random.uniform(200, min(credit_limit, total_owed / n_cards * 1.5))
                utilization = (balance / credit_limit) * 100
                interest_rate = np.random.uniform(12.99, 29.99)
                minimum_payment = max(25, balance * 0.03)  # Typical 3% or $25 minimum
                days_until_due = np.random.randint(1, 30)
                
                # Determine priority based on rules
                # High priority if: high interest, high utilization, or due soon
                priority_score = 0
                if interest_rate > 22:
                    priority_score += 3
                elif interest_rate > 18:
                    priority_score += 2
                else:
                    priority_score += 1
                
                if utilization > 70:
                    priority_score += 3
                elif utilization > 50:
                    priority_score += 2
                elif utilization > 30:
                    priority_score += 1
                
                if days_until_due <= 7:
                    priority_score += 3
                elif days_until_due <= 14:
                    priority_score += 2
                else:
                    priority_score += 1
                
                cards.append({
                    'balance': balance,
                    'credit_limit': credit_limit,
                    'utilization': utilization,
                    'interest_rate': interest_rate,
                    'minimum_payment': minimum_payment,
                    'days_until_due': days_until_due,
                    'priority_score': priority_score
                })
            
            # Assign priorities (1=highest, n=lowest) based on scores
            cards.sort(key=lambda x: x['priority_score'], reverse=True)
            for priority, card in enumerate(cards, 1):
                scenarios.append({
                    'scenario_id': _,
                    'balance': card['balance'],
                    'credit_limit': card['credit_limit'],
                    'utilization': card['utilization'],
                    'interest_rate': card['interest_rate'],
                    'minimum_payment': card['minimum_payment'],
                    'days_until_due': card['days_until_due'],
                    'available_funds': available_funds,
                    'total_owed': sum(c['balance'] for c in cards),
                    'priority': priority  # Target variable
                })
        
        return pd.DataFrame(scenarios)
    
    def generate_spending_pattern_data(self, n_samples: int = 5000) -> pd.DataFrame:
        """
        Generate data for spending pattern classification
        
        Features: monthly_spending, transaction_frequency, avg_transaction, category_distribution
        Target: spending_pattern (conservative, moderate, aggressive)
        """
        patterns = []
        
        for _ in range(n_samples):
            credit_limit = np.random.choice([1000, 2000, 5000, 10000])
            
            # Generate pattern type
            pattern_type = np.random.choice(['conservative', 'moderate', 'aggressive'], p=[0.3, 0.5, 0.2])
            
            if pattern_type == 'conservative':
                utilization = np.random.uniform(5, 25)
                n_transactions = np.random.randint(5, 15)
                groceries_pct = np.random.uniform(30, 50)
                dining_pct = np.random.uniform(5, 15)
                shopping_pct = np.random.uniform(10, 20)
            elif pattern_type == 'moderate':
                utilization = np.random.uniform(25, 60)
                n_transactions = np.random.randint(12, 30)
                groceries_pct = np.random.uniform(20, 35)
                dining_pct = np.random.uniform(15, 25)
                shopping_pct = np.random.uniform(15, 30)
            else:  # aggressive
                utilization = np.random.uniform(60, 95)
                n_transactions = np.random.randint(25, 50)
                groceries_pct = np.random.uniform(10, 25)
                dining_pct = np.random.uniform(20, 35)
                shopping_pct = np.random.uniform(25, 45)
            
            monthly_spending = (credit_limit * utilization) / 100
            avg_transaction = monthly_spending / n_transactions if n_transactions > 0 else 0
            
            patterns.append({
                'credit_limit': credit_limit,
                'monthly_spending': monthly_spending,
                'utilization': utilization,
                'transaction_frequency': n_transactions,
                'avg_transaction_amount': avg_transaction,
                'groceries_pct': groceries_pct,
                'dining_pct': dining_pct,
                'shopping_pct': shopping_pct,
                'spending_pattern': pattern_type
            })
        
        return pd.DataFrame(patterns)


if __name__ == '__main__':
    # Test data generation
    generator = CreditDataGenerator()
    
    print("Generating transaction data...")
    txn_data = generator.generate_transaction_data(n_users=100, n_months=6)
    print(f"Generated {len(txn_data)} transactions")
    print(txn_data.head())
    
    print("\nGenerating payment priority data...")
    payment_data = generator.generate_payment_priority_data(n_scenarios=500)
    print(f"Generated {len(payment_data)} payment scenarios")
    print(payment_data.head())
    
    print("\nGenerating spending pattern data...")
    pattern_data = generator.generate_spending_pattern_data(n_samples=1000)
    print(f"Generated {len(pattern_data)} spending patterns")
    print(pattern_data.head())
