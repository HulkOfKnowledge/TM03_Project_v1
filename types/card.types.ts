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
  balance?: number; // Running balance after transaction
  zone?: 'Safe' | 'Caution' | 'Danger'; // Calculated zone based on utilization
  utilizationPercentage?: number; // Calculated utilization at time of transaction
}

export interface DateFilter {
  type: 'month' | 'range' | 'year';
  startDate: string; // ISO date string
  endDate: string;   // ISO date string
  label: string;     // Display label (e.g., "January 2026")
}

export type SortField = 'zone' | 'month' | 'startBalance' | 'endingBalance' | 'peakUsage' | 'payment' | 'date' | 'amount';
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

// ─── Period-metrics types (single source of truth from /api/cards/metrics) ───

export interface CardPeriodMetrics {
  id: string;
  bank: string;
  lastFour: string;
  creditLimit: number;
  /** Balance owed as of the effective end date of the period (capped at today). */
  endingBalance: number;
  /** endingBalance / creditLimit * 100, 2 dp. */
  utilizationPct: number;
  /** Sum of all debits (purchases) within [startDate, effectiveEndDate]. */
  totalSpending: number;
  /** Sum of all credits (payments) within [startDate, effectiveEndDate]. */
  totalPayments: number;
}

export interface PeriodMetricsSummary {
  totalCreditLimit: number;
  totalEndingBalance: number;
  totalUtilizationPct: number;
  totalSpending: number;
  totalPayments: number;
  totalAvailable: number;
}

export interface CardMetricsResponse {
  startDate: string;
  endDate: string;
  /** min(endDate, today)  the actual cut-off used for balance/utilization. */
  effectiveEndDate: string;
  cards: CardPeriodMetrics[];
  totals: PeriodMetricsSummary;
  prevPeriod: {
    startDate: string;
    endDate: string;
    cards: CardPeriodMetrics[];
    totals: PeriodMetricsSummary;
  };
  daily: {
    /** ISO date strings from startDate to endDate. */
    dates: string[];
    spending: {
      byCard: Record<string, number[]>;
      combined: number[];
    };
    utilization: {
      /** null for future dates. */
      byCard: Record<string, (number | null)[]>;
      combined: (number | null)[];
    };
  };
}
