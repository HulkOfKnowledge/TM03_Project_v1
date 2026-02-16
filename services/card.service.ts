/**
 * Card Service
 * Handles card data, metrics, and transaction history
 */

import type { CardMetric, CardHistoryRow, CardOverviewData } from '@/types/card.types';

export class CardService {
  /**
   * Get card metrics (sample data)
   * TODO: Replace with real API call to fetch card metrics
   */
  getCardMetrics(): CardMetric[] {
    return [
      { label: 'Credit balance', value: '$2,000', info: true, description: '$2,000 to be paid' },
      { label: 'Due date', value: '19/12/2025', info: true, description: '2 168 hours left' },
      { label: 'Transactions this month', value: '25', info: true, description: '6 Your record' },
      { label: 'Payment Amount', value: '$200', info: true, description: '+$125 this month' },
    ];
  }

  /**
   * Get card transaction history (sample data)
   * TODO: Replace with real API call to fetch transaction history
   */
  getCardHistory(): CardHistoryRow[] {
    return [
      { month: 'December', zone: 'Safe', startBalance: '$900.45', endingBalance: '$700', peakUsage: '$200', payment: '-$200' },
      { month: 'November', zone: 'Danger', startBalance: '$1100', endingBalance: '$900.45', peakUsage: '$200', payment: '-$200' },
      { month: 'October', zone: 'Safe', startBalance: '$1300', endingBalance: '$1100', peakUsage: '$200', payment: '-$200' },
      { month: 'September', zone: 'Safe', startBalance: '$1000', endingBalance: '$1000', peakUsage: '-$200', payment: '-$200' },
      { month: 'August', zone: 'Caution', startBalance: '$1100', endingBalance: '$900.45', peakUsage: '$200', payment: '-$200' },
      { month: 'July', zone: 'Safe', startBalance: '$900.45', endingBalance: '$700', peakUsage: '-$200', payment: '-$200' },
      { month: 'June', zone: 'Safe', startBalance: '$500', endingBalance: '$300', peakUsage: '$200', payment: '-$200' },
      { month: 'May', zone: 'Safe', startBalance: '$800', endingBalance: '$800', peakUsage: '$0.00', payment: '-$200' },
      { month: 'April', zone: 'Safe', startBalance: '$1100', endingBalance: '$1499', peakUsage: '-$200', payment: '-$200' },
      { month: 'March', zone: 'Safe', startBalance: '$500', endingBalance: '$700', peakUsage: '$200', payment: '-$200' },
    ];
  }

  /**
   * Get complete card overview data
   * @param cardId - The ID of the card to fetch data for
   * TODO: Use cardId to fetch specific card data from API
   */
  getCardOverviewData(cardId: string): CardOverviewData {
    return {
      metrics: this.getCardMetrics(),
      history: this.getCardHistory(),
      utilizationPercentage: 20,
      utilizationZone: 'Safe',
    };
  }

  /**
   * Calculate utilization zone based on percentage
   */
  calculateUtilizationZone(percentage: number): 'Safe' | 'Caution' | 'Danger' {
    if (percentage < 25) return 'Safe';
    if (percentage < 30) return 'Caution';
    return 'Danger';
  }
}

// Export singleton instance
export const cardService = new CardService();
