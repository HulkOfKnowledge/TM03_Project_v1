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
  startBalance: string;
  endingBalance: string;
  peakUsage: string;
  payment: string;
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
  statementBalance: string;
  amountPaid: string;
  paymentStatus: 'On Time' | 'Late' | 'Missed';
  peakUsage: string;
  alerts: string;
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface CreditAnalysisData {
  totalCreditAvailable: number;
  totalAmountOwed: number;
  creditUtilizationRate: number;
  cardBalances: CardBalance[];
  paymentHistory: PaymentHistoryRow[];
  utilizationChartData: ChartDataPoint[];
  spendingChartData: ChartDataPoint[];
  averageSpending: number;
}
