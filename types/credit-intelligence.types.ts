/**
 * Credit Intelligence Service Type Definitions
 * Types for communicating with the Python FastAPI microservice
 */

// ==================== ANALYZE CREDIT DATA ====================
export interface CreditDataPayload {
  userId: string;
  cards: CardDataForAnalysis[];
  timestamp: string;
}

export interface CardDataForAnalysis {
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
}

export interface AnalyzeCreditResponse {
  userId: string;
  insights: CreditInsightGenerated[];
  recommendations: PaymentRecommendation[];
  analysisTimestamp: string;
}

// ==================== CREDIT INSIGHTS ====================
export interface CreditInsightGenerated {
  type: 'recommendation' | 'alert' | 'achievement' | 'tip';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: {
    en: string;
    fr: string;
    ar: string;
  };
  message: {
    en: string;
    fr: string;
    ar: string;
  };
  actionRequired: boolean;
  metadata?: Record<string, unknown>;
}

// ==================== PAYMENT RECOMMENDATIONS ====================
export interface PaymentRecommendationRequest {
  userId: string;
  cards: CardDataForAnalysis[];
  availableAmount: number; // Amount user can pay this month
  optimizationGoal: 'minimize_interest' | 'balanced' | 'minimize_balance';
}

export interface PaymentRecommendation {
  cardId: string;
  suggestedAmount: number;
  reasoning: {
    en: string;
    fr: string;
    ar: string;
  };
  expectedImpact: {
    interestSaved: number;
    utilizationImprovement: number;
  };
  priority: number; // 1 = highest priority
}

export interface PaymentRecommendationResponse {
  userId: string;
  totalAmount: number;
  recommendations: PaymentRecommendation[];
  strategy: string;
  projectedSavings: {
    monthlyInterest: number;
    annualInterest: number;
  };
}

// ==================== PAYOFF SIMULATION ====================
export interface PayoffSimulationRequest {
  userId: string;
  cardId: string;
  currentBalance: number;
  interestRate: number;
  minimumPayment: number;
  extraPayment: number; // Additional payment per month
}

export interface PayoffSimulationResponse {
  cardId: string;
  scenarios: PayoffScenario[];
}

export interface PayoffScenario {
  paymentAmount: number; // Monthly payment
  monthsToPayoff: number;
  totalInterestPaid: number;
  totalAmountPaid: number;
  payoffDate: string;
}

// ==================== STOCHASTIC DECISION SUPPORT ====================
export interface StochasticTransactionData {
  id: string;
  cardId: string;
  date: string;
  description: string;
  amount: number;
  category: string | null;
  merchantName: string | null;
  balance?: number | null;
}

export interface SpendingProbabilityRequest {
  lookbackDays?: number;
  currentCategory?: string | null;
  cardId?: string;
}

export interface CategoryProbability {
  category: string;
  probability: number;
}

export interface SpendingProbabilityResponse {
  userId: string;
  currentCategory: string;
  probabilities: CategoryProbability[];
  topCategory: string;
  transitionCounts: Record<string, Record<string, number>>;
  computedAt: string;
}

export interface CardChoiceRequest {
  merchantName: string;
  merchantCategory?: string | null;
  estimatedAmount: number;
  lookbackDays?: number;
}

export interface CardActionValue {
  cardId: string;
  qValue: number;
  immediateReward: number;
  expectedNextValue: number;
  estimatedPostUtilization: number;
}

export interface CardChoiceCounterfactual {
  baselineCardId?: string | null;
  recommendedCardId: string;
  estimatedRewardBaseline: number;
  estimatedRewardRecommended: number;
  estimatedIncrementalReward: number;
  estimatedMonthlyIncrementalReward: number;
  estimatedAnnualIncrementalReward: number;
}

export interface UpgradeOpportunity {
  topSpendCategory: string;
  estimatedMonthlySpend: number;
  currentBestRewardRate: number;
  suggestedOfferName?: string | null;
  suggestedOfferIssuer?: string | null;
  suggestedOfferRewardRate?: number | null;
  estimatedMonthlyIncrementalReward?: number | null;
  estimatedAnnualIncrementalReward?: number | null;
}

export interface CardChoiceResponse {
  userId: string;
  merchantName: string;
  merchantCategory: string;
  recommendedCardId: string;
  policyReasoning: {
    en: string;
    fr: string;
    ar: string;
  };
  actionValues: CardActionValue[];
  counterfactual: CardChoiceCounterfactual;
  upgradeOpportunity?: UpgradeOpportunity | null;
  computedAt: string;
}

// ==================== WEBHOOK PAYLOADS ====================
export interface CreditAnalysisWebhookPayload {
  eventType: 'analysis_complete' | 'recommendations_ready';
  userId: string;
  data: AnalyzeCreditResponse | PaymentRecommendationResponse;
  timestamp: string;
  signature: string; // HMAC signature for verification
}

// ==================== ERROR RESPONSES ====================
export interface CreditIntelligenceError {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
}

// ==================== TYPE GUARDS ====================
export function isCreditIntelligenceError(
  response: AnalyzeCreditResponse | CreditIntelligenceError
): response is CreditIntelligenceError {
  return 'error' in response;
}
