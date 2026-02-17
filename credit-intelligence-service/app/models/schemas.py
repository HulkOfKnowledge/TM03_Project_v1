"""
Pydantic Models - Request/Response Schemas
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional, Literal
from datetime import datetime


# ==================== CARD DATA ====================
class CardData(BaseModel):
    """Credit card data for analysis"""
    card_id: str
    institution_name: str
    current_balance: float = Field(ge=0)
    credit_limit: float = Field(gt=0)
    utilization_percentage: float = Field(ge=0, le=100)
    minimum_payment: float = Field(ge=0)
    payment_due_date: Optional[str] = None
    interest_rate: Optional[float] = Field(None, ge=0)
    last_payment_amount: Optional[float] = Field(None, ge=0)
    last_payment_date: Optional[str] = None


# ==================== ANALYZE CREDIT ====================
class AnalyzeCreditRequest(BaseModel):
    """Request to analyze user's credit data"""
    user_id: str
    cards: List[CardData]
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class CreditInsight(BaseModel):
    """Generated credit insight"""
    type: Literal["recommendation", "alert", "achievement", "tip"]
    priority: Literal["low", "medium", "high", "urgent"]
    title: dict  # {en: str, fr: str, ar: str}
    message: dict  # {en: str, fr: str, ar: str}
    action_required: bool = False
    metadata: Optional[dict] = None


class AnalyzeCreditResponse(BaseModel):
    """Response with credit analysis results"""
    user_id: str
    overall_score: float = Field(ge=0, le=100)
    insights: List[CreditInsight]
    recommendations: List["PaymentRecommendation"]
    analysis_timestamp: str


# ==================== PAYMENT RECOMMENDATIONS ====================
class PaymentRecommendationRequest(BaseModel):
    """Request for payment recommendations"""
    user_id: str
    cards: List[CardData]
    available_amount: float = Field(gt=0)
    optimization_goal: Literal["minimize_interest", "improve_score", "balanced"]


class ExpectedImpact(BaseModel):
    """Expected impact of payment recommendation"""
    interest_saved: float
    utilization_improvement: float
    score_impact_estimate: float


class PaymentRecommendation(BaseModel):
    """Individual payment recommendation for a card"""
    card_id: str
    suggested_amount: float
    reasoning: dict  # {en: str, fr: str, ar: str}
    expected_impact: ExpectedImpact
    priority: int = Field(ge=1)


class ProjectedSavings(BaseModel):
    """Projected interest savings"""
    monthly_interest: float
    annual_interest: float


class PaymentRecommendationResponse(BaseModel):
    """Response with payment recommendations"""
    user_id: str
    total_amount: float
    recommendations: List[PaymentRecommendation]
    strategy: str
    projected_savings: ProjectedSavings


# ==================== PAYOFF SIMULATION ====================
class PayoffSimulationRequest(BaseModel):
    """Request to simulate loan payoff"""
    user_id: str
    card_id: str
    current_balance: float = Field(gt=0)
    interest_rate: float = Field(ge=0)
    minimum_payment: float = Field(gt=0)
    extra_payment: float = Field(ge=0)


class PayoffScenario(BaseModel):
    """Single payoff scenario"""
    payment_amount: float
    months_to_payoff: int
    total_interest_paid: float
    total_amount_paid: float
    payoff_date: str


class PayoffSimulationResponse(BaseModel):
    """Response with payoff scenarios"""
    card_id: str
    scenarios: List[PayoffScenario]


# ==================== TRANSACTION INSIGHTS ====================
class TransactionData(BaseModel):
    """Transaction data for insight generation"""
    id: str
    card_id: str
    date: str
    description: str
    amount: float
    category: Optional[str] = None
    merchant_name: Optional[str] = None


class TransactionInsightRequest(BaseModel):
    """Request for transaction-level insights"""
    user_id: str
    transaction: TransactionData
    card_context: dict  # Contains current_balance, credit_limit, utilization, etc.


class TransactionInsight(BaseModel):
    """Individual transaction insight"""
    type: str  # utilization_warning, spending_pattern, payment_due, etc.
    severity: str  # urgent, high, medium, low, info
    message: dict  # {en: str, fr: str, ar: str}
    metadata: Optional[dict] = None


class TransactionInsightResponse(BaseModel):
    """Response with transaction insights"""
    transaction_id: str
    insights: List[TransactionInsight]


# Update forward references
AnalyzeCreditResponse.model_rebuild()
