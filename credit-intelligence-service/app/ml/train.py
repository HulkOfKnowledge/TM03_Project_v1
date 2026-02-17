"""
Model Training Script
Train all credit intelligence models
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from app.ml.data_generator import CreditDataGenerator
from app.ml.models import CreditIntelligenceModels


def main():
    """Train all models"""
    print("=" * 60)
    print("Credit Intelligence Model Training")
    print("=" * 60)
    
    # Initialize
    generator = CreditDataGenerator(seed=42)
    models = CreditIntelligenceModels()
    
    # 1. Generate and train payment priority model
    print("\n[1/3] Payment Priority Model")
    print("-" * 60)
    payment_data = generator.generate_payment_priority_data(n_scenarios=2000)
    payment_results = models.train_payment_priority_model(payment_data)
    print(f"Feature importance:")
    for feature, importance in payment_results['feature_importance'].items():
        print(f"  {feature}: {importance:.4f}")
    
    # 2. Generate and train spending pattern model
    print("\n[2/3] Spending Pattern Classifier")
    print("-" * 60)
    pattern_data = generator.generate_spending_pattern_data(n_samples=3000)
    pattern_results = models.train_spending_pattern_model(pattern_data)
    print(f"Classes: {pattern_results['classes']}")
    
    # 3. Generate and train utilization predictor
    print("\n[3/3] Utilization Predictor")
    print("-" * 60)
    transaction_data = generator.generate_transaction_data(n_users=300, n_months=12)
    utilization_results = models.train_utilization_predictor(transaction_data)
    
    # Save all preprocessing objects
    models.save_scalers_and_encoders()
    
    print("\n" + "=" * 60)
    print("Training Complete!")
    print("=" * 60)
    print(f"\nModels saved to: {models.model_dir}")
    print("\nSummary:")
    print(f"  Payment Priority - Test Accuracy: {payment_results['test_accuracy']:.3f}")
    print(f"  Spending Pattern - Test Accuracy: {pattern_results['test_accuracy']:.3f}")
    print(f"  Utilization Predictor - Test R²: {utilization_results['test_r2']:.3f}")
    print("\nModels are ready for use!")


if __name__ == '__main__':
    main()
