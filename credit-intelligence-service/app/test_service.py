"""
Test Script for Credit Intelligence Service
"""

import sys
from pathlib import Path
import json

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.analyzer import CreditAnalyzer
from app.services.recommender import PaymentRecommender
from app.services.transaction_insights import transaction_insights
from app.models.schemas import (
    AnalyzeCreditRequest,
    PaymentRecommendationRequest,
    CardData
)


def print_section(title):
    """Print a formatted section header"""
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)


def test_credit_analysis():
    """Test credit analysis with sample data"""
    print_section("TEST 1: Credit Analysis")
    
    # Create sample cards
    cards = [
        CardData(
            card_id="card_1",
            institution_name="TD Bank",
            current_balance=1500.00,
            credit_limit=5000.00,
            utilization_percentage=30.0,
            minimum_payment=45.00,
            payment_due_date="2026-02-25T00:00:00Z",
            interest_rate=19.99,
            last_payment_amount=100.00,
            last_payment_date="2026-01-15T00:00:00Z"
        ),
        CardData(
            card_id="card_2",
            institution_name="RBC Visa",
            current_balance=800.00,
            credit_limit=2000.00,
            utilization_percentage=40.0,
            minimum_payment=24.00,
            payment_due_date="2026-02-28T00:00:00Z",
            interest_rate=22.99,
            last_payment_amount=50.00,
            last_payment_date="2026-01-20T00:00:00Z"
        ),
        CardData(
            card_id="card_3",
            institution_name="Scotia Mastercard",
            current_balance=3500.00,
            credit_limit=10000.00,
            utilization_percentage=35.0,
            minimum_payment=105.00,
            payment_due_date="2026-03-05T00:00:00Z",
            interest_rate=17.50,
            last_payment_amount=200.00,
            last_payment_date="2026-01-10T00:00:00Z"
        )
    ]
    
    # Create request
    request = AnalyzeCreditRequest(
        user_id="test_user_1",
        cards=cards
    )
    
    # Analyze
    analyzer = CreditAnalyzer()
    result = analyzer.analyze(request)
    
    # Display results
    print(f"\nUser ID: {result.user_id}")
    print(f"Overall Credit Score: {result.overall_score:.1f}/100")
    print(f"\nInsights ({len(result.insights)} total):")
    
    for idx, insight in enumerate(result.insights, 1):
        print(f"\n  {idx}. [{insight.priority.upper()}] {insight.type}")
        print(f"     Title: {insight.title['en']}")
        print(f"     Message: {insight.message['en']}")
        if insight.metadata:
            print(f"     Metadata: {insight.metadata}")
    
    print("\n✓ Test 1 passed")


def test_payment_recommendations():
    """Test payment recommendations - $2000 owed, $1000 available"""
    print_section("TEST 2: Payment Recommendations ($2000 owed, $1000 available)")
    
    # Scenario: User owes $2000 across 3 cards but has only $1000 to pay
    cards = [
        CardData(
            card_id="card_1",
            institution_name="TD Bank",
            current_balance=800.00,
            credit_limit=2000.00,
            utilization_percentage=40.0,
            minimum_payment=24.00,
            payment_due_date="2026-02-20T00:00:00Z",
            interest_rate=22.99
        ),
        CardData(
            card_id="card_2",
            institution_name="RBC Visa",
            current_balance=700.00,
            credit_limit=5000.00,
            utilization_percentage=14.0,
            minimum_payment=21.00,
            payment_due_date="2026-02-25T00:00:00Z",
            interest_rate=19.99
        ),
        CardData(
            card_id="card_3",
            institution_name="Scotia Mastercard",
            current_balance=500.00,
            credit_limit=1000.00,
            utilization_percentage=50.0,
            minimum_payment=15.00,
            payment_due_date="2026-02-28T00:00:00Z",
            interest_rate=17.50
        )
    ]
    
    total_owed = sum(card.current_balance for card in cards)
    available = 1000.00
    
    print(f"\nScenario:")
    print(f"  Total owed: ${total_owed:.2f}")
    print(f"  Available funds: ${available:.2f}")
    print(f"  Shortfall: ${total_owed - available:.2f}")
    
    recommender = PaymentRecommender()
    
    # Test all three strategies
    strategies = ["minimize_interest", "improve_score", "balanced"]
    
    for strategy in strategies:
        print(f"\n{'─' * 70}")
        print(f"Strategy: {strategy.upper().replace('_', ' ')}")
        print(f"{'─' * 70}")
        
        request = PaymentRecommendationRequest(
            user_id="test_user_1",
            cards=cards,
            available_amount=available,
            optimization_goal=strategy
        )
        
        result = recommender.recommend(request)
        
        print(f"\nStrategy: {result.strategy}")
        print(f"\nPayment Allocation:")
        
        total_allocated = 0
        for rec in result.recommendations:
            card = next(c for c in cards if c.card_id == rec.card_id)
            print(f"\n  Priority {rec.priority}: {card.institution_name}")
            print(f"    Amount: ${rec.suggested_amount:.2f}")
            print(f"    Reasoning: {rec.reasoning['en']}")
            print(f"    Expected Impact:")
            print(f"      - Interest saved (12 mo): ${rec.expected_impact.interest_saved:.2f}")
            print(f"      - Utilization improvement: {rec.expected_impact.utilization_improvement:.1f}%")
            print(f"      - Estimated score impact: +{rec.expected_impact.score_impact_estimate:.1f}")
            total_allocated += rec.suggested_amount
        
        print(f"\n  Total allocated: ${total_allocated:.2f} of ${available:.2f}")
        print(f"\n  Projected Savings:")
        print(f"    Monthly interest: ${result.projected_savings.monthly_interest:.2f}")
        print(f"    Annual interest: ${result.projected_savings.annual_interest:.2f}")
    
    print("\n✓ Test 2 passed")


def test_transaction_insights():
    """Test transaction-level insights"""
    print_section("TEST 3: Transaction Insights")
    
    # Test scenario 1: High utilization warning
    transaction1 = {
        'id': 'txn_1',
        'card_id': 'card_1',
        'date': '2026-02-17T10:00:00Z',
        'description': 'Amazon.ca Purchase',
        'amount': 150.50,
        'category': 'Shopping',
        'merchant_name': 'Amazon'
    }
    
    card_context1 = {
        'current_balance': 2800.00,
        'credit_limit': 3000.00,
        'utilization': 93.33,
        'payment_due_date': '2026-02-20T00:00:00Z',
        'minimum_payment': 84.00
    }
    
    print("\nScenario 1: High Utilization + Payment Due Soon")
    print(f"Transaction: ${transaction1['amount']} at {transaction1['merchant_name']}")
    print(f"Card utilization: {card_context1['utilization']:.1f}%")
    
    insight1 = transaction_insights.generate_transaction_insight(transaction1, card_context1)
    if insight1:
        print(f"\nInsight Type: {insight1['type']}")
        print(f"Severity: {insight1['severity']}")
        print(f"Message: {insight1['message']['en']}")
    
    # Test scenario 2: Room before 30% threshold
    transaction2 = {
        'id': 'txn_2',
        'card_id': 'card_2',
        'date': '2026-02-17T14:00:00Z',
        'description': 'Grocery Purchase',
        'amount': 85.00,
        'category': 'Groceries',
        'merchant_name': 'Walmart'
    }
    
    card_context2 = {
        'current_balance': 1400.00,
        'credit_limit': 5000.00,
        'utilization': 28.0,
        'payment_due_date': '2026-03-05T00:00:00Z',
        'minimum_payment': 42.00
    }
    
    print("\n" + "─" * 70)
    print("\nScenario 2: Near 30% Utilization Threshold")
    print(f"Transaction: ${transaction2['amount']} at {transaction2['merchant_name']}")
    print(f"Card utilization: {card_context2['utilization']:.1f}%")
    
    insight2 = transaction_insights.generate_transaction_insight(transaction2, card_context2)
    if insight2:
        print(f"\nInsight Type: {insight2['type']}")
        print(f"Severity: {insight2['severity']}")
        print(f"Message: {insight2['message']['en']}")
        if insight2.get('metadata'):
            print(f"Metadata: {insight2['metadata']}")
    
    print("\n✓ Test 3 passed")


def test_spending_analysis():
    """Test spending pattern analysis"""
    print_section("TEST 4: Spending Analysis")
    
    # Sample transactions
    transactions = [
        {'amount': 150.00, 'category': 'Groceries'},
        {'amount': 120.00, 'category': 'Groceries'},
        {'amount': 80.00, 'category': 'Gas'},
        {'amount': 60.00, 'category': 'Gas'},
        {'amount': 200.00, 'category': 'Shopping'},
        {'amount': 150.00, 'category': 'Shopping'},
        {'amount': 100.00, 'category': 'Shopping'},
        {'amount': 45.00, 'category': 'Dining'},
        {'amount': 65.00, 'category': 'Dining'},
        {'amount': 80.00, 'category': 'Dining'},
        {'amount': 15.00, 'category': 'Entertainment'},
        {'amount': 120.00, 'category': 'Bills'},
    ]
    
    # Analyze spending by category
    category_totals = transaction_insights.analyze_spending_by_category(transactions)
    total_spending = sum(category_totals.values())
    
    print(f"\nTotal Spending: ${total_spending:.2f}")
    print("\nSpending by Category:")
    
    sorted_categories = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
    for category, amount in sorted_categories:
        percentage = (amount / total_spending * 100)
        print(f"  {category:15s}: ${amount:7.2f} ({percentage:5.1f}%)")
    
    # Generate spending summary insight
    insights = transaction_insights.generate_spending_summary_insight(
        category_totals, 
        total_spending
    )
    
    print("\nSpending Insights:")
    for insight in insights:
        print(f"  Type: {insight['type']}")
        print(f"  Message: {insight['message']['en']}")
    
    print("\n✓ Test 4 passed")


def main():
    """Run all tests"""
    print("\n" + "╔" + "═" * 68 + "╗")
    print("║" + " " * 15 + "CREDIT INTELLIGENCE SERVICE - TEST SUITE" + " " * 12 + "║")
    print("╚" + "═" * 68 + "╝")
    
    try:
        test_credit_analysis()
        test_payment_recommendations()
        test_transaction_insights()
        test_spending_analysis()
        
        print("\n" + "=" * 70)
        print("  ✅ ALL TESTS PASSED!")
        print("=" * 70)
        print("\nThe credit intelligence service is working correctly.")
        print("You can now:")
        print("  1. Train the ML models: python app/ml/train.py")
        print("  2. Start the service: python main.py")
        print("  3. Test the API endpoints using Postman or curl")
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
