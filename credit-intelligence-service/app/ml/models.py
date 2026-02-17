"""
Machine Learning Models
Credit intelligence prediction models
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
from sklearn.ensemble import RandomForestClassifier, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
import joblib
import os
from pathlib import Path


class CreditIntelligenceModels:
    """ML models for credit intelligence"""
    
    def __init__(self, model_dir: str = "app/ml/trained_models"):
        """Initialize models"""
        self.model_dir = Path(model_dir)
        self.model_dir.mkdir(parents=True, exist_ok=True)
        
        # Models
        self.payment_priority_model = None
        self.spending_pattern_model = None
        self.utilization_predictor = None
        
        # Preprocessing
        self.scalers = {}
        self.encoders = {}
        
        # Try to load pre-trained models
        self._load_models()
    
    def _load_models(self):
        """Load pre-trained models if available"""
        try:
            payment_path = self.model_dir / "payment_priority_model.joblib"
            pattern_path = self.model_dir / "spending_pattern_model.joblib"
            utilization_path = self.model_dir / "utilization_predictor.joblib"
            scaler_path = self.model_dir / "scalers.joblib"
            encoder_path = self.model_dir / "encoders.joblib"
            
            if payment_path.exists():
                self.payment_priority_model = joblib.load(payment_path)
            if pattern_path.exists():
                self.spending_pattern_model = joblib.load(pattern_path)
            if utilization_path.exists():
                self.utilization_predictor = joblib.load(utilization_path)
            if scaler_path.exists():
                self.scalers = joblib.load(scaler_path)
            if encoder_path.exists():
                self.encoders = joblib.load(encoder_path)
        except Exception as e:
            print(f"Could not load models: {e}")
    
    def train_payment_priority_model(self, data: pd.DataFrame) -> Dict:
        """
        Train model to predict payment priority
        
        Features: balance, credit_limit, utilization, interest_rate, 
                 minimum_payment, days_until_due, available_funds, total_owed
        Target: priority (1, 2, 3, ...)
        """
        print("Training payment priority model...")
        
        features = [
            'balance', 'credit_limit', 'utilization', 'interest_rate',
            'minimum_payment', 'days_until_due', 'available_funds', 'total_owed'
        ]
        
        X = data[features]
        y = data['priority']
        
        # Scale features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        self.scalers['payment_priority'] = scaler
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42
        )
        
        # Train Random Forest Classifier
        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            class_weight='balanced'
        )
        model.fit(X_train, y_train)
        
        # Evaluate
        train_score = model.score(X_train, y_train)
        test_score = model.score(X_test, y_test)
        
        self.payment_priority_model = model
        
        # Save model
        joblib.dump(model, self.model_dir / "payment_priority_model.joblib")
        
        print(f"Payment priority model trained. Train accuracy: {train_score:.3f}, Test accuracy: {test_score:.3f}")
        
        return {
            'train_accuracy': train_score,
            'test_accuracy': test_score,
            'feature_importance': dict(zip(features, model.feature_importances_))
        }
    
    def train_spending_pattern_model(self, data: pd.DataFrame) -> Dict:
        """
        Train model to classify spending patterns
        
        Features: monthly_spending, utilization, transaction_frequency, 
                 avg_transaction_amount, category percentages
        Target: spending_pattern (conservative, moderate, aggressive)
        """
        print("Training spending pattern model...")
        
        features = [
            'credit_limit', 'monthly_spending', 'utilization', 
            'transaction_frequency', 'avg_transaction_amount',
            'groceries_pct', 'dining_pct', 'shopping_pct'
        ]
        
        X = data[features]
        y = data['spending_pattern']
        
        # Encode labels
        encoder = LabelEncoder()
        y_encoded = encoder.fit_transform(y)
        self.encoders['spending_pattern'] = encoder
        
        # Scale features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        self.scalers['spending_pattern'] = scaler
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y_encoded, test_size=0.2, random_state=42
        )
        
        # Train Random Forest
        model = RandomForestClassifier(
            n_estimators=100,
            max_depth=8,
            random_state=42
        )
        model.fit(X_train, y_train)
        
        # Evaluate
        train_score = model.score(X_train, y_train)
        test_score = model.score(X_test, y_test)
        
        self.spending_pattern_model = model
        
        # Save model
        joblib.dump(model, self.model_dir / "spending_pattern_model.joblib")
        
        print(f"Spending pattern model trained. Train accuracy: {train_score:.3f}, Test accuracy: {test_score:.3f}")
        
        return {
            'train_accuracy': train_score,
            'test_accuracy': test_score,
            'classes': encoder.classes_.tolist()
        }
    
    def train_utilization_predictor(self, data: pd.DataFrame) -> Dict:
        """
        Train regression model to predict next month's utilization
        
        Features: current_utilization, monthly_spending, transaction_frequency, etc.
        Target: next_month_utilization
        """
        print("Training utilization predictor...")
        
        # Prepare data - group by user and card, calculate next month utilization
        df = data.copy()
        df['month'] = pd.to_datetime(df['transaction_date']).dt.to_period('M')
        
        monthly = df.groupby(['user_id', 'card_id', 'month']).agg({
            'amount': 'sum',
            'transaction_date': 'count',
            'utilization_at_transaction': 'last',
            'credit_limit': 'first'
        }).reset_index()
        
        monthly.columns = ['user_id', 'card_id', 'month', 'monthly_spending', 
                          'transaction_count', 'utilization', 'credit_limit']
        
        # Calculate features from previous month to predict next month
        monthly = monthly.sort_values(['user_id', 'card_id', 'month'])
        monthly['next_utilization'] = monthly.groupby(['user_id', 'card_id'])['utilization'].shift(-1)
        monthly['prev_utilization'] = monthly.groupby(['user_id', 'card_id'])['utilization'].shift(1)
        monthly['spending_trend'] = monthly.groupby(['user_id', 'card_id'])['monthly_spending'].pct_change()
        
        # Remove rows without next month data
        monthly = monthly.dropna(subset=['next_utilization'])
        
        features = [
            'utilization', 'monthly_spending', 'transaction_count', 
            'credit_limit', 'spending_trend'
        ]
        
        # Fill NaN in spending_trend
        monthly['spending_trend'] = monthly['spending_trend'].fillna(0)
        
        X = monthly[features]
        y = monthly['next_utilization']
        
        # Scale features
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        self.scalers['utilization_predictor'] = scaler
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42
        )
        
        # Train Gradient Boosting Regressor
        model = GradientBoostingRegressor(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            random_state=42
        )
        model.fit(X_train, y_train)
        
        # Evaluate
        train_score = model.score(X_train, y_train)
        test_score = model.score(X_test, y_test)
        
        self.utilization_predictor = model
        
        # Save model
        joblib.dump(model, self.model_dir / "utilization_predictor.joblib")
        
        print(f"Utilization predictor trained. Train R²: {train_score:.3f}, Test R²: {test_score:.3f}")
        
        return {
            'train_r2': train_score,
            'test_r2': test_score
        }
    
    def save_scalers_and_encoders(self):
        """Save preprocessing objects"""
        joblib.dump(self.scalers, self.model_dir / "scalers.joblib")
        joblib.dump(self.encoders, self.model_dir / "encoders.joblib")
    
    def predict_payment_priority(
        self, 
        cards_data: List[Dict], 
        available_funds: float
    ) -> List[Dict]:
        """
        Predict payment priority for multiple cards
        
        Returns list of cards with priority scores (1=highest priority)
        """
        if self.payment_priority_model is None:
            # Fallback to rule-based if model not trained
            return self._rule_based_payment_priority(cards_data, available_funds)
        
        total_owed = sum(card['balance'] for card in cards_data)
        
        features_list = []
        for card in cards_data:
            features = [
                card['balance'],
                card['credit_limit'],
                card['utilization'],
                card.get('interest_rate', 19.99),
                card.get('minimum_payment', card['balance'] * 0.03),
                card.get('days_until_due', 15),
                available_funds,
                total_owed
            ]
            features_list.append(features)
        
        # Scale features
        scaler = self.scalers.get('payment_priority')
        if scaler:
            X = scaler.transform(features_list)
        else:
            X = np.array(features_list)
        
        # Predict priorities
        priorities = self.payment_priority_model.predict(X)
        
        # Add priority to cards
        results = []
        for card, priority in zip(cards_data, priorities):
            card_copy = card.copy()
            card_copy['priority'] = int(priority)
            results.append(card_copy)
        
        # Sort by priority
        results.sort(key=lambda x: x['priority'])
        
        return results
    
    def _rule_based_payment_priority(
        self, 
        cards_data: List[Dict], 
        available_funds: float
    ) -> List[Dict]:
        """Fallback rule-based payment prioritization"""
        results = []
        
        for card in cards_data:
            # Calculate priority score
            score = 0
            
            # Interest rate weight (higher = more urgent)
            interest_rate = card.get('interest_rate', 19.99)
            score += interest_rate * 2
            
            # Utilization weight (higher = more urgent for credit score)
            utilization = card['utilization']
            if utilization > 70:
                score += 50
            elif utilization > 50:
                score += 30
            elif utilization > 30:
                score += 15
            
            # Days until due (less time = more urgent)
            days_until_due = card.get('days_until_due', 15)
            if days_until_due <= 7:
                score += 40
            elif days_until_due <= 14:
                score += 20
            
            card_copy = card.copy()
            card_copy['priority_score'] = score
            results.append(card_copy)
        
        # Sort by score (highest first) and assign priorities
        results.sort(key=lambda x: x['priority_score'], reverse=True)
        for idx, card in enumerate(results, 1):
            card['priority'] = idx
        
        return results
    
    def predict_spending_pattern(self, features: Dict) -> str:
        """
        Predict spending pattern: conservative, moderate, or aggressive
        """
        if self.spending_pattern_model is None:
            # Fallback to rule-based
            utilization = features.get('utilization', 0)
            if utilization < 25:
                return 'conservative'
            elif utilization < 60:
                return 'moderate'
            else:
                return 'aggressive'
        
        feature_vector = [
            features.get('credit_limit', 5000),
            features.get('monthly_spending', 1000),
            features.get('utilization', 30),
            features.get('transaction_frequency', 15),
            features.get('avg_transaction_amount', 50),
            features.get('groceries_pct', 25),
            features.get('dining_pct', 20),
            features.get('shopping_pct', 20)
        ]
        
        # Scale features
        scaler = self.scalers.get('spending_pattern')
        if scaler:
            X = scaler.transform([feature_vector])
        else:
            X = np.array([feature_vector])
        
        # Predict
        prediction = self.spending_pattern_model.predict(X)[0]
        
        # Decode label
        encoder = self.encoders.get('spending_pattern')
        if encoder:
            return encoder.inverse_transform([prediction])[0]
        
        return ['conservative', 'moderate', 'aggressive'][prediction]
    
    def predict_next_utilization(self, features: Dict) -> float:
        """
        Predict next month's utilization percentage
        """
        if self.utilization_predictor is None:
            # Simple rule-based prediction
            current = features.get('utilization', 30)
            trend = features.get('spending_trend', 0)
            return min(100, max(0, current * (1 + trend)))
        
        feature_vector = [
            features.get('utilization', 30),
            features.get('monthly_spending', 1000),
            features.get('transaction_count', 15),
            features.get('credit_limit', 5000),
            features.get('spending_trend', 0)
        ]
        
        # Scale features
        scaler = self.scalers.get('utilization_predictor')
        if scaler:
            X = scaler.transform([feature_vector])
        else:
            X = np.array([feature_vector])
        
        # Predict
        prediction = self.utilization_predictor.predict(X)[0]
        
        # Clamp to valid range
        return min(100, max(0, prediction))


# Global instance
ml_models = CreditIntelligenceModels()
