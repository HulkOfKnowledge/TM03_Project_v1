/**
 * Card Service
 * Handles card data, metrics, and transaction history
 */

import type { 
  CardMetric, 
  CardHistoryRow, 
  CardOverviewData,
  CreditAnalysisData,
  PaymentHistoryRow,
  CardBalance,
  ChartDataPoint,
} from '@/types/card.types';

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
  getCardOverviewData(_cardId: string): CardOverviewData {
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

  /**
   * Get credit analysis data (sample data)
   * TODO: Replace with real API call to /api/cards/analysis
   */
  async getCreditAnalysisData(): Promise<CreditAnalysisData> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Sample payment history data
    const paymentHistory: PaymentHistoryRow[] = [
      { month: 'December', statementBalance: '$900.45', amountPaid: '$700', paymentStatus: 'On Time', peakUsage: '45%', alerts: 'High Usage' },
      { month: 'November', statementBalance: '$25,000.45', amountPaid: '$900.45', paymentStatus: 'On Time', peakUsage: '45%', alerts: 'High Usage' },
      { month: 'October', statementBalance: '$900.45', amountPaid: '$1100', paymentStatus: 'On Time', peakUsage: '45%', alerts: 'High Usage' },
      { month: 'September', statementBalance: '$900.45', amountPaid: '$1000', paymentStatus: 'Late', peakUsage: '45%', alerts: 'High Usage' },
      { month: 'August', statementBalance: '$900.45', amountPaid: '$900.45', paymentStatus: 'On Time', peakUsage: '18%', alerts: '-' },
    ];

    // Sample card balances
    const cardBalances: CardBalance[] = [
      { name: 'Card 1', balance: 200 },
      { name: 'Card 2', balance: 200 },
      { name: 'Card 3', balance: 200 },
    ];

    // Sample utilization chart data (3 lines: Safe, Caution, Danger)
    const utilizationChartData: ChartDataPoint[] = [
      { label: 'Jan', value: 100 },
      { label: 'Feb', value: 120 },
      { label: 'Mar', value: 140 },
      { label: 'Apr', value: 150 },
      { label: 'May', value: 160 },
      { label: 'Jun', value: 180 },
      { label: 'Jul', value: 200 },
      { label: 'Aug', value: 220 },
      { label: 'Sep', value: 240 },
      { label: 'Oct', value: 260 },
      { label: 'Nov', value: 280 },
      { label: 'Dec', value: 300 },
    ];

    // Sample spending chart data
    const spendingChartData: ChartDataPoint[] = [
      { label: 'Jan', value: 80 },
      { label: 'Feb', value: 120 },
      { label: 'Mar', value: 150 },
      { label: 'Apr', value: 180 },
      { label: 'May', value: 200 },
      { label: 'Jun', value: 170 },
      { label: 'Jul', value: 160 },
      { label: 'Aug', value: 200 },
      { label: 'Sep', value: 250 },
      { label: 'Oct', value: 300 },
      { label: 'Nov', value: 350 },
      { label: 'Dec', value: 400 },
    ];

    return {
      totalCreditAvailable: 4000,
      totalAmountOwed: 400,
      creditUtilizationRate: 25,
      cardBalances,
      paymentHistory,
      utilizationChartData,
      spendingChartData,
      averageSpending: 400,
    };
  }
}

// Export singleton instance
export const cardService = new CardService();
