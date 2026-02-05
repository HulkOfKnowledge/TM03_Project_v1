# Credit Intelligence Architecture

## Overview

Creduman's credit intelligence system is built as a **microservices architecture** with two main components:
1. **Next.js Frontend & API** (TypeScript) - User interface and API routes
2. **Credit Intelligence Service** (Python/FastAPI) - AI-powered analysis engine

This document explains how user credit data flows through the system and how the intelligence service generates insights and recommendations.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Interface                          │
│                    (Next.js Client Component)                   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ HTTP Requests
                             │
┌────────────────────────────▼────────────────────────────────────┐
│                      Next.js API Routes                         │
│  /api/credit-intelligence/analyze                               │
│  /api/credit-intelligence/recommendations                       │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             │ Credit Intelligence Service Client
                             │ (credit-intelligence.service.ts)
                             │
┌────────────────────────────▼────────────────────────────────────┐
│             Python FastAPI Microservice                         │
│                   (Port 8000)                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  POST /api/v1/analyze                                   │   │
│  │  POST /api/v1/recommendations                           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                             │                                   │
│  ┌──────────────────────────▼──────────────────────────────┐   │
│  │              Credit Analysis Services                   │   │
│  │  • CreditAnalyzer (analyzer.py)                         │   │
│  │  • PaymentRecommender (recommender.py)                  │   │
│  │  • PayoffSimulator (simulator.py) [Future]             │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Credit Data Collection

**Source**: Demo data or live Flinks integration

```typescript
// Demo data structure (from demo_user_cards table)
{
  id: string;
  institution_name: string;
  card_name: string;
  credit_limit: number;
  current_balance: number;
  utilization_percentage: number;
  minimum_payment: number;
  payment_due_date: string;
  interest_rate: number;
  // ... additional fields
}
```

**Location**: 
- Database: `demo_user_cards`, `demo_transactions`, `demo_payments`
- Service: `demo-data.service.ts` or `flinks.service.ts` (for live data)

### 2. Analysis Request Flow

#### Step 1: User Interaction
User visits the **Card Dashboard** page and clicks "Sync All Cards"

#### Step 2: Frontend Request
```typescript
// app/card-dashboard/page.tsx
const response = await fetch('/api/credit-intelligence/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
});
```

#### Step 3: Next.js API Route Processing
```typescript
// app/api/credit-intelligence/analyze/route.ts
export async function POST(request: NextRequest) {
  // 1. Fetch user's credit card data from database
  const demoData = await demoDataService.getDashboardData();
  
  // 2. Transform to CreditDataPayload format
  const payload = {
    userId: demoData.user.id,
    timestamp: new Date().toISOString(),
    cards: demoData.cards.map(card => ({
      cardId: card.id,
      currentBalance: card.current_balance,
      creditLimit: card.credit_limit,
      utilizationPercentage: card.utilization_percentage,
      // ... more fields
    }))
  };
  
  // 3. Send to Python service
  const analysis = await creditIntelligenceService.analyzeCredit(payload);
  
  return NextResponse.json(createSuccessResponse(analysis));
}
```

#### Step 4: Python Service Analysis
```python
# credit-intelligence-service/app/api/analyze.py
@router.post("/analyze")
async def analyze_credit(request: AnalyzeCreditRequest):
    # Delegate to CreditAnalyzer service
    return analyzer.analyze(request)
```

```python
# credit-intelligence-service/app/services/analyzer.py
class CreditAnalyzer:
    def analyze(self, request: AnalyzeCreditRequest):
        # 1. Calculate overall credit health score (0-100)
        overall_score = self.calculate_overall_score(request.cards)
        
        # 2. Generate insights based on rules
        insights = self.generate_insights(request.cards)
        
        return AnalyzeCreditResponse(
            user_id=request.user_id,
            overall_score=overall_score,
            insights=insights,
            analysis_timestamp=datetime.utcnow().isoformat()
        )
```

**Analysis Logic**:
- **Utilization Score**: Calculates weighted average across all cards
- **Payment Penalties**: Deducts points for upcoming due dates
- **Insight Generation**: Rule-based alerts for:
  - High utilization (>70% urgent, >50% high, >30% medium)
  - Upcoming payment deadlines
  - Credit improvement opportunities

#### Step 5: Response to Frontend
```typescript
// Analysis response structure
{
  userId: string;
  overallScore: number;  // 0-100
  insights: [
    {
      type: "high_utilization" | "payment_due" | "improvement",
      priority: "urgent" | "high" | "medium",
      title: { en: "High Credit Utilization" },
      message: { en: "Your Visa card is at 78% utilization..." },
      actionRequired: boolean
    }
  ],
  analysisTimestamp: string;
}
```

---

### 3. Payment Recommendations Flow

#### Step 1: User Configuration
User adjusts:
- **Available Amount**: Monthly budget for payments (e.g., $600)
- **Optimization Goal**: 
  - `minimize_interest` - Prioritize highest APR cards
  - `improve_score` - Prioritize highest utilization cards
  - `balanced` - Hybrid approach (default)

#### Step 2: Request Processing
```typescript
// app/api/credit-intelligence/recommendations/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  const payload = {
    userId: demoData.user.id,
    availableAmount: body.availableAmount,  // e.g., 600
    optimizationGoal: body.optimizationGoal, // e.g., "balanced"
    cards: [...] // Same card data as analysis
  };
  
  const recommendations = 
    await creditIntelligenceService.getPaymentRecommendations(payload);
    
  return NextResponse.json(createSuccessResponse(recommendations));
}
```

#### Step 3: Python Recommendation Engine
```python
# credit-intelligence-service/app/services/recommender.py
class PaymentRecommender:
    def recommend(self, request: PaymentRecommendationRequest):
        cards = request.cards
        available_amount = request.available_amount
        
        # 1. Calculate minimum payments required
        minimum_total = sum(card.minimum_payment for card in cards)
        extra_pool = available_amount - minimum_total
        
        # 2. Prioritize cards based on goal
        if request.optimization_goal == "minimize_interest":
            priority_cards = sorted(cards, 
                                  key=lambda c: c.interest_rate, 
                                  reverse=True)
        elif request.optimization_goal == "improve_score":
            priority_cards = sorted(cards, 
                                  key=lambda c: c.utilization_percentage, 
                                  reverse=True)
        else:  # balanced
            priority_cards = sorted(cards,
                key=lambda c: (c.utilization_percentage * 0.6) + 
                             (c.interest_rate * 0.4),
                reverse=True)
        
        # 3. Allocate extra payments intelligently
        recommendations = []
        for card in priority_cards:
            extra_payment = min(remaining, card.current_balance - card.minimum_payment)
            suggested_amount = card.minimum_payment + extra_payment
            
            # 4. Calculate expected impact
            impact = self.calculate_impact(card, suggested_amount)
            
            recommendations.append({
                card_id: card.card_id,
                suggested_amount: suggested_amount,
                reasoning: "Pay to minimize interest...",
                expected_impact: impact,
                priority: index
            })
        
        # 5. Calculate projected savings
        projected_savings = self.calculate_projected_savings(
            cards, recommendations
        )
        
        return PaymentRecommendationResponse(...)
```

#### Step 4: Display in UI
```typescript
// Frontend displays recommendations in table format
{
  priority: 1,
  card: "TD Rewards Visa",
  suggestedAmount: "$450.00",
  reasoning: "Pay $450 to TD to improve utilization from 78% to 45%",
  expectedImpact: {
    interestSaved: 12.50,
    utilizationImprovement: 33.0,
    scoreImpactEstimate: 8
  }
}
```

---

## Key Components

### Frontend Components

#### Card Dashboard (`app/card-dashboard/page.tsx`)
- **Purpose**: Main UI for viewing credit cards and insights
- **State Management**:
  - `state`: Dashboard data (cards, transactions, payments)
  - `analysis`: Credit analysis results
  - `recommendations`: Payment recommendations
- **Features**:
  - View modes (all cards, single card, compare 2-3 cards)
  - Summary statistics (total balance, utilization, etc.)
  - Real-time analysis on card sync
  - Dynamic recommendation updates

### Backend Services

#### Credit Intelligence Service Client (`services/credit-intelligence.service.ts`)
- **Purpose**: TypeScript client for Python microservice
- **Methods**:
  - `analyzeCredit()`: Request credit analysis
  - `getPaymentRecommendations()`: Get payment strategy
- **Configuration**:
  - Base URL: `process.env.CREDIT_INTELLIGENCE_API_URL`
  - API Key authentication: `process.env.CREDIT_INTELLIGENCE_API_KEY`
  - 60s timeout for ML processing

#### Demo Data Service (`services/demo-data.service.ts`)
- **Purpose**: Fetch demo user data from Supabase
- **Methods**:
  - `getDashboardData()`: Returns user, cards, transactions, payments
- **Note**: In production, this would be replaced with live Flinks data

### Python Microservice

#### Credit Analyzer (`credit-intelligence-service/app/services/analyzer.py`)
**Responsibilities**:
1. **Score Calculation**: 
   - Utilization score (weighted by credit limits)
   - Payment deadline penalties
   - Overall health score (0-100)

2. **Insight Generation**:
   - High utilization alerts
   - Payment due reminders
   - Credit improvement tips
   - Multilingual support (en, fr, ar)

3. **Future**: ML model integration for predictive insights

#### Payment Recommender (`credit-intelligence-service/app/services/recommender.py`)
**Optimization Strategies**:

1. **Minimize Interest**:
   - Sort cards by interest rate (highest first)
   - Pay minimums on low-APR cards
   - Apply extra payments to highest APR

2. **Improve Score**:
   - Sort cards by utilization (highest first)
   - Aim to reduce all cards below 30%
   - Balance payments across cards

3. **Balanced** (Default):
   - Weighted scoring: `(utilization × 0.6) + (APR × 0.4)`
   - Considers both factors proportionally

**Impact Calculation**:
- Interest saved per month
- Utilization improvement percentage
- Estimated credit score impact

---

## Data Models

### Credit Data Payload (TypeScript → Python)
```typescript
interface CreditDataPayload {
  userId: string;
  timestamp: string;
  cards: Array<{
    cardId: string;
    institutionName: string;
    currentBalance: number;
    creditLimit: number;
    utilizationPercentage: number;
    minimumPayment: number;
    paymentDueDate: string | null;
    interestRate: number | null;
    lastPaymentAmount: number | null;
    lastPaymentDate: string | null;
  }>;
}
```

### Analysis Response (Python → TypeScript)
```typescript
interface AnalyzeCreditResponse {
  userId: string;
  overallScore: number;
  insights: Array<{
    type: string;
    priority: "urgent" | "high" | "medium" | "low";
    title: { en: string; fr?: string; ar?: string };
    message: { en: string; fr?: string; ar?: string };
    actionRequired: boolean;
  }>;
  recommendations: Array<{
    cardId: string;
    suggestedAmount: number;
    reasoning: { en: string };
    expectedImpact: {
      interestSaved: number;
      utilizationImprovement: number;
      scoreImpactEstimate: number;
    };
    priority: number;
  }>;
  analysisTimestamp: string;
}
```

### Recommendation Request
```typescript
interface PaymentRecommendationRequest {
  userId: string;
  availableAmount: number;
  optimizationGoal: "minimize_interest" | "improve_score" | "balanced";
  cards: CardDataForAnalysis[];
}
```

---

## Environment Configuration

### Next.js Environment Variables
```bash
# Python microservice connection
CREDIT_INTELLIGENCE_API_URL=http://localhost:8000
CREDIT_INTELLIGENCE_API_KEY=your_secret_api_key_here
WEBHOOK_SECRET=your_webhook_secret_here

# Feature flags
NEXT_PUBLIC_DEMO_MODE=true
```

### Python Service Environment Variables
```python
# app/core/config.py
ALLOWED_ORIGINS=["http://localhost:3000"]
API_KEY=your_secret_api_key_here
```

---

## Communication Protocol

### Authentication
All requests to Python service include:
```http
POST /api/v1/analyze
Content-Type: application/json
X-API-Key: your_secret_api_key_here

{
  "user_id": "...",
  "cards": [...]
}
```

### Error Handling
Both services use standardized error responses:

**Next.js API**:
```typescript
{
  success: false,
  error: {
    code: "INTERNAL_ERROR",
    message: "Analysis service unavailable"
  }
}
```

**Python Service**:
```python
{
  "detail": "Error message"
}
```

---

## Future Enhancements

### Machine Learning Integration
Current implementation uses **rules-based logic**. Future plans:
- Train ML models on historical payment data
- Predict optimal payment strategies
- Forecast credit score changes
- Anomaly detection for unusual spending

### Webhook Support
For asynchronous processing:
1. Submit analysis request → receive job ID
2. Python service processes in background
3. Webhook callback to Next.js when complete
4. Store results in database
5. Notify user via email/push notification

### Additional Features
- **Payoff Simulator**: Model different payment scenarios
- **Goal Tracking**: Set and track credit improvement goals
- **Spending Insights**: Category-based spending analysis
- **Credit Score Monitoring**: Track score changes over time

---

## Development Workflow

### Running Locally

1. **Start Python Service**:
```bash
cd credit-intelligence-service
python -m uvicorn main:app --reload --port 8000
```

2. **Start Next.js App**:
```bash
npm run dev
```

3. **Access Application**:
- Frontend: http://localhost:3000
- Python API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Testing Flow
1. Navigate to Card Dashboard
2. Click "Load Demo Cards"
3. Observe automatic analysis request
4. Adjust payment amount/goal
5. View updated recommendations in real-time

---

## Security Considerations

### API Key Management
- Never expose API keys in client-side code
- Use environment variables for all secrets
- Rotate keys regularly

### Data Privacy
- User credit data never leaves secure backend
- All sensitive operations server-side only
- HTTPS required for production

### Webhook Verification
Future implementation will include:
- HMAC-SHA256 signature verification
- Timestamp validation to prevent replay attacks
- Request rate limiting

---

## Summary

The Credit Intelligence system separates concerns:
- **Next.js**: User interface, API routing, data fetching
- **Python Service**: Complex analysis, ML models (future), optimization algorithms

**Data flows unidirectionally**:
User → Frontend → Next.js API → Python Service → Analysis → Response → UI Update

This architecture enables:
- **Scalability**: Python service can scale independently
- **Flexibility**: Easy to swap analysis algorithms
- **Performance**: TypeScript for fast UI, Python for complex computation
- **Maintainability**: Clear separation of concerns
