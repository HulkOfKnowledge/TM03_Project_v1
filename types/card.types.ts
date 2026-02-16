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
