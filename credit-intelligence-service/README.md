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

4. **Stochastic Decision Support (POC)**
   - **Markov Chain**: probability of next spending category from transaction transitions
   - **MDP Card Choice**: recommend best card for a merchant by balancing rewards, utilization risk, APR, and due-date pressure
   - Designed to work in read-only mode on synthetic data now, and with Flinks transaction categories later

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

# Activate  Windows
venv\Scripts\activate

# Activate  macOS / Linux
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
- `POST /api/v1/spending-probability` - Markov-chain next-category probabilities
- `POST /api/v1/card-choice` - MDP-style card recommendation at merchant

### Stochastic decision outputs

`POST /api/v1/card-choice` returns:

- `action_values`: Q-value per card action
- `counterfactual`: gain estimate if user switches from baseline card to recommended card
   - `estimated_incremental_reward` for the current purchase
   - `estimated_monthly_incremental_reward` and `estimated_annual_incremental_reward`

`POST /api/credit-intelligence/card-choice` (Next.js route) also returns:

- `upgradeOpportunity`: phase-2 suggestion from `credit_card_offers`
   - "You spend a lot on category X; offer Y could add ~$Z/month"

### Flinks compatibility notes

- Uses transaction fields already aligned with Flinks `/GetAccountsDetail` (`date`, `description`, `balance`)
- Uses `raw_category` when available today and is ready for Flinks Enrich `/GetCategorization` output
- No write operations are required by these endpoints; they run on read-only transaction snapshots

Visit `http://localhost:8000/docs` for interactive API documentation.

## 🧮 Math Notes (Markov + MDP)

### 1) Markov chain for next spending category

State is category `c_t`. Transition counts are built from adjacent transactions.

Smoothed transition probability (Laplace smoothing):

$$
P(c_{t+1}=j \mid c_t=i)=\frac{N_{ij}+\alpha}{\sum_k N_{ik}+\alpha K}
$$

- `N_ij`: count of transitions from category `i` to `j`
- `K`: number of categories
- `alpha`: smoothing constant (currently `1.0`)

### 2) MDP-style card choice

Action is selecting a card for a merchant/category.

Q-value approximation:

$$
Q(s,a)=R(s,a)+\gamma \sum_{s'} P(s'\mid s,a)V(s')
$$

- `R(s,a)`: immediate reward (rewards earned minus APR/utilization/due-date penalties)
- `gamma`: discount factor (currently `0.9`)
- `P(s'|s,a)`: transition probability between utilization buckets (`low`, `medium`, `high`)

Counterfactual gain shown to users is:

$$
\Delta r = r_{recommended} - r_{baseline}
$$

and scaled to monthly/annual estimates using recent category spend.

## ✅ How To Test New Endpoints

### A) Local Python service-level test suite

Run:

```bash
python app/test_service.py
```

This now includes **TEST 5** for:

- Markov next-category probabilities
- MDP card recommendation + counterfactual gain output

### B) Direct API test for Markov (Python service)

```bash
curl -X POST "http://localhost:8000/api/v1/spending-probability" \
   -H "Content-Type: application/json" \
   -H "X-API-Key: <YOUR_CREDIT_INTELLIGENCE_API_KEY>" \
   -d '{
      "user_id": "test_user_1",
      "current_category": "groceries",
      "lookback_days": 180,
      "transactions": [
         {"id":"t1","card_id":"c1","date":"2026-02-01","description":"Sobeys","amount":120,"category":"groceries","merchant_name":"Sobeys","balance":900},
         {"id":"t2","card_id":"c1","date":"2026-02-02","description":"Shell","amount":60,"category":"gas","merchant_name":"Shell","balance":960},
         {"id":"t3","card_id":"c1","date":"2026-02-03","description":"Metro","amount":80,"category":"groceries","merchant_name":"Metro","balance":1040}
      ]
   }'
```

### C) Direct API test for MDP + counterfactual (Python service)

```bash
curl -X POST "http://localhost:8000/api/v1/card-choice" \
   -H "Content-Type: application/json" \
   -H "X-API-Key: <YOUR_CREDIT_INTELLIGENCE_API_KEY>" \
   -d '{
      "user_id": "test_user_1",
      "merchant_name": "Air Canada",
      "merchant_category": "travel",
      "estimated_amount": 350,
      "lookback_days": 180,
      "cards": [
         {
            "card_id":"card_a",
            "institution_name":"Tangerine Mastercard",
            "current_balance":1100,
            "credit_limit":4000,
            "utilization_percentage":27.5,
            "minimum_payment":40,
            "payment_due_date":"2026-03-25T00:00:00Z",
            "interest_rate":20.99,
            "estimated_reward_rate_by_category":{"travel":0.01,"default":0.01}
         },
         {
            "card_id":"card_b",
            "institution_name":"Amex Cobalt",
            "current_balance":900,
            "credit_limit":5000,
            "utilization_percentage":18,
            "minimum_payment":35,
            "payment_due_date":"2026-03-20T00:00:00Z",
            "interest_rate":21.99,
            "estimated_reward_rate_by_category":{"travel":0.03,"default":0.01}
         }
      ],
      "transactions": [
         {"id":"t1","card_id":"card_a","date":"2026-02-01","description":"Air Canada","amount":420,"category":"travel","merchant_name":"Air Canada","balance":1200}
      ]
   }'
```

### D) Phase-2 upgrade opportunity test (Next.js route)

Call `POST /api/credit-intelligence/card-choice` from an authenticated app session.
The route computes `upgradeOpportunity` by comparing current card reward rates with rows in `credit_card_offers`.

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
