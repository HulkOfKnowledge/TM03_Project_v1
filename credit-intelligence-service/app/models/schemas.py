"""
Pydantic Models - Request/Response Schemas
"""

from pydantic import BaseModel, Field, validator
from typing import Any, List, Optional, Literal, Dict
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
    insights: List[CreditInsight]
    recommendations: List["PaymentRecommendation"]
    analysis_timestamp: str


# ==================== PAYMENT RECOMMENDATIONS ====================
class PaymentRecommendationRequest(BaseModel):
    """Request for payment recommendations"""
    user_id: str
    cards: List[CardData]
    available_amount: float = Field(gt=0)
    optimization_goal: Literal["minimize_interest", "balanced", "minimize_balance"] = "balanced"


class ExpectedImpact(BaseModel):
    """Expected impact of payment recommendation"""
    interest_saved: float
    utilization_improvement: float


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


class StochasticTransactionData(BaseModel):
    """Transaction data used by Markov/MDP models"""
    id: str
    card_id: str
    date: str
    description: str
    amount: float
    category: Optional[str] = None
    merchant_name: Optional[str] = None
    balance: Optional[float] = None


class TransactionInsightRequest(BaseModel):
    """Request for transaction-level insights"""
    user_id: str
    transaction: TransactionData
    card_context: dict  # Contains card context fields used for insight generation.


class TransactionInsight(BaseModel):
    """Individual transaction insight"""
    type: str  # transaction_category, payment_due_urgent, payment_due_soon, etc.
    severity: str  # urgent, high, medium, low, info
    message: dict  # {en: str, fr: str, ar: str}
    metadata: Optional[dict] = None


class TransactionInsightResponse(BaseModel):
    """Response with transaction insights"""
    transaction_id: str
    insights: List[TransactionInsight]


# ==================== STOCHASTIC DECISIONING ====================
class CategoryProbability(BaseModel):
    """Probability of spending in a category on next transaction"""
    category: str
    probability: float = Field(ge=0, le=1)


class SpendingProbabilityRequest(BaseModel):
    """Request for Markov-chain spending category prediction"""
    user_id: str
    transactions: List[StochasticTransactionData]
    current_category: Optional[str] = None
    lookback_days: int = Field(default=180, ge=30, le=730)


class SpendingProbabilityResponse(BaseModel):
    """Response for Markov-chain category probabilities"""
    user_id: str
    current_category: str
    probabilities: List[CategoryProbability]
    top_category: str
    transition_counts: Dict[str, Dict[str, int]]
    computed_at: str


class CardDecisionCandidate(BaseModel):
    """Candidate card for merchant-level card choice (MDP action set)"""
    card_id: str
    institution_name: str
    current_balance: float = Field(ge=0)
    credit_limit: float = Field(gt=0)
    utilization_percentage: float = Field(ge=0, le=100)
    minimum_payment: float = Field(ge=0)
    payment_due_date: Optional[str] = None
    interest_rate: Optional[float] = Field(None, ge=0)
    estimated_reward_rate_by_category: Optional[Dict[str, float]] = None


class CardChoiceRequest(BaseModel):
    """Request for merchant-level card selection via MDP"""
    user_id: str
    merchant_name: str
    merchant_category: Optional[str] = None
    used_card_id: Optional[str] = None
    estimated_amount: float = Field(default=50.0, ge=1)
    lookback_days: int = Field(default=180, ge=30, le=730)
    cards: List[CardDecisionCandidate]
    transactions: List[StochasticTransactionData]


class CardActionValue(BaseModel):
    """MDP action value (Q-value) per card"""
    card_id: str
    q_value: float
    immediate_reward: float
    expected_next_value: float
    estimated_post_utilization: float


class CardChoiceCounterfactual(BaseModel):
    """What user could gain by using recommended card instead of current behavior"""
    baseline_card_id: Optional[str] = None
    recommended_card_id: str
    estimated_reward_baseline: float
    estimated_reward_recommended: float
    estimated_incremental_reward: float
    estimated_monthly_incremental_reward: float
    estimated_annual_incremental_reward: float


class OwnedCardOpportunity(BaseModel):
    """Scenario 1: Better card exists among cards user already owns."""
    used_card_id: str
    recommended_card_id: str
    estimated_incremental_reward: float
    estimated_monthly_incremental_reward: float
    estimated_annual_incremental_reward: float
    message: Dict[str, str]


class UpgradeOpportunity(BaseModel):
    """Phase-2 opportunity to suggest a better external card for top spend category"""
    top_spend_category: str
    estimated_monthly_spend: float
    spend_share_percentage: Optional[float] = None
    current_best_reward_rate: float
    suggested_offer_name: Optional[str] = None
    suggested_offer_issuer: Optional[str] = None
    suggested_offer_id: Optional[str] = None
    suggested_offer_reward_rate: Optional[float] = None
    estimated_monthly_incremental_reward: Optional[float] = None
    estimated_annual_incremental_reward: Optional[float] = None
    annual_fee: Optional[float] = None
    suggested_offers: Optional[List[Dict[str, Any]]] = None
    insight_message: Optional[Dict[str, str]] = None


class CardChoiceResponse(BaseModel):
    """Response with recommended card and policy diagnostics"""
    user_id: str
    merchant_name: str
    merchant_category: str
    recommended_card_id: str
    policy_reasoning: Dict[str, str]
    action_values: List[CardActionValue]
    counterfactual: CardChoiceCounterfactual
    owned_card_opportunity: Optional[OwnedCardOpportunity] = None
    upgrade_opportunity: Optional[UpgradeOpportunity] = None
    new_card_opportunities: Optional[List[UpgradeOpportunity]] = None
    upgrade_opportunities: Optional[List[UpgradeOpportunity]] = None
    computed_at: str


class CardChoiceBatchRequest(BaseModel):
    """Request for evaluating card-choice opportunities over multiple transactions in one call."""
    user_id: str
    lookback_days: int = Field(default=180, ge=30, le=730)
    cards: List[CardDecisionCandidate]
    transactions: List[StochasticTransactionData]
    recent_transactions: List[StochasticTransactionData]


class CardChoiceBatchItem(BaseModel):
    """Per-transaction result from a batched card-choice evaluation."""
    transaction_id: str
    used_card_id: Optional[str] = None
    merchant_name: str
    merchant_category: Optional[str] = None
    estimated_amount: float
    card_choice: Optional[CardChoiceResponse] = None
    skipped_code: Optional[str] = None
    skipped_reason: Optional[str] = None


class CardChoiceBatchResponse(BaseModel):
    """Batch response for card-choice evaluations."""
    user_id: str
    results: List[CardChoiceBatchItem]
    computed_at: str


class NewCardOpportunitiesRequest(BaseModel):
    """Request for scenario 2: suggest external cards user does not currently own."""
    user_id: str
    lookback_days: int = Field(default=180, ge=30, le=730)
    cards: List[CardDecisionCandidate]
    transactions: List[StochasticTransactionData]


class NewCardOpportunitiesResponse(BaseModel):
    """Response containing ranked new-card opportunities."""
    user_id: str
    opportunities: List[UpgradeOpportunity]
    computed_at: str


class ForecastCategoryTotal(BaseModel):
    category: str
    amount: float


class ForecastAnomaly(BaseModel):
    category: str
    average_monthly: float
    month_to_date: float
    day_of_month: int
    baseline_months: List[str]


class ForecastMonthlyPoint(BaseModel):
    month: str
    total: float


class ForecastSnapshot(BaseModel):
    mtd_spend: float
    projected_month_end: float
    projected_low: float
    projected_high: float
    confidence: Literal["High", "Medium", "Low"]
    status: Literal["On Track", "Watch", "Risk"]
    day_of_month: int
    month_days: int


class ForecastNextSpendProbability(BaseModel):
    category: str
    probability: float


class ForecastNextSpendPrediction(BaseModel):
    current_category: str
    top_category: str
    probabilities: List[ForecastNextSpendProbability]


class ForecastInsightsRequest(BaseModel):
    user_id: str
    transactions: List[StochasticTransactionData]
    start_date: str
    end_date: str
    current_date: Optional[str] = None


class ForecastInsightsResponse(BaseModel):
    user_id: str
    start_date: str
    end_date: str
    top_categories: List[ForecastCategoryTotal]
    anomaly: Optional[ForecastAnomaly] = None
    monthly_trend: List[ForecastMonthlyPoint]
    forecast_snapshot: Optional[ForecastSnapshot] = None
    next_spend_prediction: Optional[ForecastNextSpendPrediction] = None
    computed_at: str


# Update forward references
AnalyzeCreditResponse.model_rebuild()
