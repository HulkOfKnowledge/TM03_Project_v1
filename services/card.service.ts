/**
 * Card Service
 * Handles card data, metrics, and transaction history
 */

import type { 
  CardMetric, 
  CardHistoryRow, 
  CardOverviewData,
  CreditAnalysisData,
  ConnectedCard,
  Transaction,
} from '@/types/card.types';

export class CardService {
  /**
   * Get card metrics from card data
   */
  getCardMetrics(card: ConnectedCard): CardMetric[] {
    // Format due date
    const dueDate = card.paymentDueDate 
      ? new Date(card.paymentDueDate).toLocaleDateString('en-CA') 
      : 'N/A';
    
    // Calculate hours until due date
    const hoursLeft = card.paymentDueDate 
      ? Math.max(0, Math.floor((new Date(card.paymentDueDate).getTime() - Date.now()) / (1000 * 60 * 60)))
      : 0;

    // Format currency values
    const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return [
      { 
        label: 'Credit balance', 
        value: formatCurrency(card.currentBalance), 
        info: true, 
        description: `${formatCurrency(card.currentBalance)} to be paid` 
      },
      { 
        label: 'Due date', 
        value: dueDate, 
        info: true, 
        description: hoursLeft > 0 ? `${hoursLeft.toLocaleString()} hours left` : 'Past due' 
      },
      { 
        label: 'Credit Limit', 
        value: formatCurrency(card.creditLimit), 
        info: true, 
        description: `Available: ${formatCurrency(card.availableCredit)}` 
      },
      { 
        label: 'Minimum Payment', 
        value: formatCurrency(card.minimumPayment), 
        info: true, 
        description: card.lastPaymentAmount ? `Last: ${formatCurrency(card.lastPaymentAmount)}` : 'No payment recorded' 
      },
    ];
  }

  /**
   * Get card transaction history from API
   */
  async getCardHistory(cardId: string): Promise<CardHistoryRow[]> {
    try {
      const response = await fetch(`/api/cards/${cardId}/monthly-history`);
      
      if (!response.ok) {
        console.error('Failed to fetch card history');
        return [];
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error('Error fetching card history:', error);
      return [];
    }
  }

  /**
   * Get card transactions from API
   */
  async getCardTransactions(cardId: string, limit: number = 50): Promise<Transaction[]> {
    try {
      const response = await fetch(`/api/cards/${cardId}/transactions?limit=${limit}`);
      
      if (!response.ok) {
        console.error('Failed to fetch card transactions');
        return [];
      }

      const result = await response.json();
      return result.data?.transactions || [];
    } catch (error) {
      console.error('Error fetching card transactions:', error);
      return [];
    }
  }

  /**
   * Get complete card overview data
   */
  async getCardOverviewData(card: ConnectedCard): Promise<CardOverviewData> {
    const metrics = this.getCardMetrics(card);
    const history = await this.getCardHistory(card.id);

    return {
      metrics,
      history,
      utilizationPercentage: card.utilizationPercentage,
      utilizationZone: this.calculateUtilizationZone(card.utilizationPercentage),
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
   * Get credit analysis data from API
   */
  async getCreditAnalysisData(): Promise<CreditAnalysisData | null> {
    try {
      const response = await fetch('/api/cards/analysis');
      
      if (!response.ok) {
        console.error('Failed to fetch credit analysis');
        return null;
      }

      const result = await response.json();
      
      if (!result.success || !result.data) {
        return null;
      }
      
      return result.data;
    } catch (error) {
      console.error('Error fetching credit analysis:', error);
      return null;
    }
  }
}

// Export singleton instance
export const cardService = new CardService();
