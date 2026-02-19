/**
 * Card Dashboard Types
 * Types for connected cards, metrics, and transaction history
 */

export interface ConnectedCard {
  id: string;
  name: string;
  bank: string;
  type: 'visa' | 'mastercard';
  lastFour: string;
  // Financial details
  currentBalance: number;
  creditLimit: number;
  availableCredit: number;
  utilizationPercentage: number;
  minimumPayment: number;
  paymentDueDate: string | null;
  lastPaymentAmount: number | null;
  lastPaymentDate: string | null;
  interestRate: number | null;
  // Metadata
  lastSyncedAt: string | null;
  isActive: boolean;
}

export interface CardMetric {
  label: string;
  value: string;
  info: boolean;
  description: string;
}

export interface CardHistoryRow {
  month: string;
  zone: 'Safe' | 'Caution' | 'Danger';
  startBalance: number;
  endingBalance: number;
  peakUsage: number;
  payment: number;
  utilizationPercentage: number;
}

export interface Transaction {
  id: string;
  cardId: string;
  date: string;
  description: string;
  amount: number;
  category: string | null;
  merchantName: string | null;
}

export type SortField = 'zone' | 'month' | 'startBalance' | 'endingBalance' | 'peakUsage' | 'payment';
export type SortDirection = 'asc' | 'desc' | null;

export interface CardOverviewData {
  metrics: CardMetric[];
  history: CardHistoryRow[];
  utilizationPercentage: number;
  utilizationZone: 'Safe' | 'Caution' | 'Danger';
}

// Credit Analysis Types

export interface CardBalance {
  name: string;
  balance: number;
}

export interface PaymentHistoryRow {
  month: string;
  cardName?: string; // Card identifier
  statementBalance: number;
  amountPaid: number;
  paymentStatus: 'On Time' | 'Late' | 'Missed';
  peakUsage: number;
  utilizationPercentage: number;
  alerts: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface CardChartData {
  cardId: string;
  cardName: string;
  data: ChartDataPoint[];
}

export interface CreditAnalysisData {
  totalCreditAvailable: number;
  totalAmountOwed: number;
  creditUtilizationRate: number;
  cardBalances: CardBalance[];
  paymentHistory: PaymentHistoryRow[];
  utilizationChartData: CardChartData[]; // Per-card utilization data
  spendingChartData: CardChartData[]; // Per-card spending data
  averageSpending: number;
  mlInsights?: {
    overallScore: number;
    insights: any[];
    recommendations: any[];
  } | null;
}
