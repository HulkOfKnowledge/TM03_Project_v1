# Credit Intelligence Service

AI-powered credit analysis and recommendation microservice for Creduman platform. This service analyzes user credit card data and provides personalized insights and payment recommendations.

## 🎯 Purpose

Creduman is a **credit guidance platform**, not a credit monitoring service. We don't provide credit scores; instead, we help users make smarter credit decisions based on their transaction data, balances, limits, due dates, and utilization.

### Key Features

1. **Credit Analysis**
   - Overall credit health score (0-100)
   - Personalized insights (alerts, recommendations, achievements, tips)
   - Multi-language support (English, French, Arabic)

2. **Transaction Insights**
   - Real-time insights per transaction
   - "You have $X left before reaching 30% utilization"
   - Spending pattern recognition ("You spent $300 in food this month")
   - Payment due date reminders

3. **Payment Recommendations**
   - Handles complex scenarios: "User owes $2000 across 3 cards but has only $1000 to pay"
   - Three optimization strategies:
     - **Minimize Interest**: Avalanche method (pay highest APR first)
     - **Improve Score**: Pay highest utilization cards first
     - **Balanced**: Hybrid ML + rules approach
   - Expected impact calculations (interest saved, utilization improvement, score impact)

## 🏗️ Architecture

### Hybrid Approach: Rules + Machine Learning

The service uses a **hybrid system** combining rule-based logic with ML models:

- **Rule-based fallback**: Works immediately without training
- **ML enhancement**: Trained models improve accuracy and personalization
- **Graceful degradation**: Service works even if models aren't trained

### ML Models

1. **Payment Priority Classifier**
   - Predicts payment priority for multiple cards
   - Features: balance, utilization, interest rate, days until due
   - Algorithm: Random Forest Classifier

2. **Spending Pattern Classifier**
   - Classifies spending as: conservative, moderate, aggressive
   - Features: monthly spending, utilization, transaction frequency, category distribution
   - Algorithm: Random Forest Classifier

3. **Utilization Predictor**
   - Predicts next month's utilization percentage
   - Features: current utilization, spending trend, transaction count
   - Algorithm: Gradient Boosting Regressor

## 🚀 Quick Start

### Requirements

- **Python 3.13+**
- A virtual environment (recommended)

### 1. Create & Activate Virtual Environment

```bash
cd credit-intelligence-service

# Create venv
python -m venv venv

# Activate — Windows
venv\Scripts\activate

# Activate — macOS / Linux
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

> **Note:** All packages require Python 3.13+.
### 3. Train ML Models (Optional but Recommended)

```bash
python app/ml/train.py
```

This generates synthetic training data and trains all models. Models are saved to `app/ml/trained_models/`.

### 4. Test the Service

```bash
python app/test_service.py
```

This runs comprehensive tests for all components.

### 5. Start the Service

```bash
python main.py
```

Service runs on `http://localhost:8000`

### Starting via npm (from project root)

The project includes cross-platform npm scripts that automatically resolve the correct venv binary on Windows, macOS, and Linux:

```bash
# Development (with hot reload)
npm run dev:python

# Production
npm run start:python
```

## 📊 API Endpoints

- `GET /` - Service info
- `GET /health` - Health check
- `POST /api/v1/analyze` - Credit analysis
- `POST /api/v1/recommendations` - Payment recommendations
- `POST /api/v1/transaction-insight` - Transaction-level insights

Visit `http://localhost:8000/docs` for interactive API documentation.

## 🧪 Testing

```bash
python app/test_service.py
```

Tests include:
- ✅ Credit analysis
- ✅ Payment recommendations (all 3 strategies)
- ✅ Transaction insights
- ✅ Spending pattern analysis

## 📝 License

Internal use for Creduman platform.

---

**Note:** This service operates in **read-only mode** on user transaction data.
