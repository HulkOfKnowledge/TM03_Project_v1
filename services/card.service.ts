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
import { 
  fetchCardTransactions, 
  fetchCardMonthlyHistory, 
  fetchCreditAnalysis 
} from '@/lib/api/cards-client';

export class CardService {
  /**
   * Get card metrics from card data
   */
  getCardMetrics(card: ConnectedCard): CardMetric[] {
    // Format due date
    const dueDate = card.paymentDueDate 
      ? new Date(card.paymentDueDate).toLocaleDateString('en-CA') 
      : 'N/A';
    
    // Calculate smart countdown until due date
    const timeLeft = (() => {
      if (!card.paymentDueDate) return null;
      const msLeft = new Date(card.paymentDueDate).getTime() - Date.now();
      if (msLeft <= 0) return null;
      const totalMins = Math.floor(msLeft / (1000 * 60));
      const days = Math.floor(totalMins / (60 * 24));
      const hours = Math.floor((totalMins % (60 * 24)) / 60);
      const mins = totalMins % 60;
      if (days >= 1) return `${days} day${days !== 1 ? 's' : ''}`;
      if (hours >= 1) return `${hours} hr${hours !== 1 ? 's' : ''}`;
      return `${mins} min${mins !== 1 ? 's' : ''}`;
    })();

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
        description: timeLeft ? `${timeLeft} left` : 'Past due' 
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
   * Get card transaction history from API (cached)
   */
  async getCardHistory(cardId: string, forceRefresh: boolean = false): Promise<CardHistoryRow[]> {
    return fetchCardMonthlyHistory(cardId, forceRefresh);
  }

  /**
   * Get card transactions from API (cached)
   */
  async getCardTransactions(cardId: string, limit: number = 50, forceRefresh: boolean = false): Promise<Transaction[]> {
    return fetchCardTransactions(cardId, limit, forceRefresh);
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
   * Calculate zones and utilization for each transaction
   * Enriches transactions with balance, utilization%, and zone information
   */
  calculateTransactionZones(transactions: Transaction[], card: ConnectedCard): Transaction[] {
    if (!transactions || transactions.length === 0) return [];
    
    // Sort transactions by date (oldest first) to calculate running balance
    const sorted = [...transactions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    let runningBalance = card.currentBalance;
    
    // If we have transactions, work backwards from current balance
    // This is an approximation - in a real system you'd get balance from each transaction
    const enriched = sorted.map((txn, index) => {
      // For now, use the balance from the transaction if available
      // Otherwise calculate based on current balance working backwards
      const balance = txn.balance || runningBalance;
      const utilizationPercentage = card.creditLimit > 0 
        ? (balance / card.creditLimit) * 100 
        : 0;
      const zone = this.calculateUtilizationZone(utilizationPercentage);
      
      // Update running balance for next transaction (working backwards)
      if (index < sorted.length - 1) {
        runningBalance = balance - sorted[index + 1].amount;
      }
      
      return {
        ...txn,
        balance,
        utilizationPercentage,
        zone
      };
    });
    
    // Return in reverse chronological order (newest first)
    return enriched.reverse();
  }

  /**
   * Get credit analysis data from API (cached)
   */
  async getCreditAnalysisData(forceRefresh: boolean = false): Promise<CreditAnalysisData | null> {
    return fetchCreditAnalysis(forceRefresh);
  }
}

// Export singleton instance
export const cardService = new CardService();
