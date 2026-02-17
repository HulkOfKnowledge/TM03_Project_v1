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
   * Check if a card is a demo card (has no real data from database)
   */
  private isDemoCard(card: ConnectedCard): boolean {
    return !card.lastSyncedAt && card.creditLimit === 0;
  }

  /**
   * Generate demo data for a card
   */
  private generateDemoData(card: ConnectedCard): {
    currentBalance: number;
    creditLimit: number;
    availableCredit: number;
    utilizationPercentage: number;
    minimumPayment: number;
    paymentDueDate: string;
    lastPaymentAmount: number;
    interestRate: number;
  } {
    // Generate deterministic but varied demo data based on card ID
    const seed = card.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const random = (min: number, max: number) => {
      const x = Math.sin(seed) * 10000;
      return Math.floor((x - Math.floor(x)) * (max - min + 1)) + min;
    };

    const creditLimit = random(2000, 10000);
    const currentBalance = random(200, Math.floor(creditLimit * 0.6));
    const availableCredit = creditLimit - currentBalance;
    const utilizationPercentage = (currentBalance / creditLimit) * 100;
    const minimumPayment = Math.floor(currentBalance * 0.03);
    const lastPaymentAmount = random(100, 500);
    const interestRate = random(15, 25);

    // Due date is always next month, 19th
    const dueDate = new Date();
    dueDate.setMonth(dueDate.getMonth() + 1);
    dueDate.setDate(19);

    return {
      currentBalance,
      creditLimit,
      availableCredit,
      utilizationPercentage,
      minimumPayment,
      paymentDueDate: dueDate.toISOString(),
      lastPaymentAmount,
      interestRate,
    };
  }

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
   * Generate demo history for a card
   */
  private generateDemoHistory(card: ConnectedCard): CardHistoryRow[] {
    const months = ['December', 'November', 'October', 'September', 'August', 'July', 'June', 'May', 'April', 'March'];
    const seed = card.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    return months.map((month, index) => {
      const x = Math.sin(seed + index) * 10000;
      const random = (x - Math.floor(x));
      
      const startBalance = 500 + Math.floor(random * 2500);
      const payment = 100 + Math.floor(random * 400);
      const endingBalance = startBalance - payment + Math.floor(random * 200);
      const peakUsage = Math.max(startBalance, endingBalance) + Math.floor(random * 300);
      const utilizationPercentage = (peakUsage / 5000) * 100;
      
      let zone: 'Safe' | 'Caution' | 'Danger' = 'Safe';
      if (utilizationPercentage >= 30) zone = 'Danger';
      else if (utilizationPercentage >= 25) zone = 'Caution';
      
      return {
        month,
        zone,
        startBalance,
        endingBalance,
        peakUsage,
        payment,
        utilizationPercentage,
      };
    });
  }

  /**
   * Get card transaction history from API or generate demo data
   */
  async getCardHistory(cardId: string, card?: ConnectedCard): Promise<CardHistoryRow[]> {
    try {
      const response = await fetch(`/api/cards/${cardId}/monthly-history`);
      
      if (!response.ok) {
        // If API fails and we have card info, generate demo data
        if (card && this.isDemoCard(card)) {
          return this.generateDemoHistory(card);
        }
        console.error('Failed to fetch card history');
        return [];
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      // If API fails and we have card info, generate demo data
      if (card && this.isDemoCard(card)) {
        return this.generateDemoHistory(card);
      }
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
    // If this is a demo card, enrich it with demo data
    let enrichedCard = card;
    if (this.isDemoCard(card)) {
      const demoData = this.generateDemoData(card);
      enrichedCard = { ...card, ...demoData };
    }

    const metrics = this.getCardMetrics(enrichedCard);
    const history = await this.getCardHistory(enrichedCard.id, enrichedCard);

    return {
      metrics,
      history,
      utilizationPercentage: enrichedCard.utilizationPercentage,
      utilizationZone: this.calculateUtilizationZone(enrichedCard.utilizationPercentage),
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
   * Generate demo credit analysis data
   */
  private generateDemoAnalysisData(cardCount: number): CreditAnalysisData {
    const cardBalances = Array.from({ length: cardCount }, (_, i) => ({
      name: `Card ${i + 1}`,
      balance: 200 + Math.floor(Math.random() * 800),
    }));

    const totalAmountOwed = cardBalances.reduce((sum, card) => sum + card.balance, 0);
    const totalCreditAvailable = cardCount * 5000;
    const creditUtilizationRate = (totalAmountOwed / totalCreditAvailable) * 100;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const utilizationChartData = months.map((label, i) => ({
      label,
      value: 100 + i * 20 + Math.floor(Math.random() * 50),
    }));

    const spendingChartData = months.map((label, i) => ({
      label,
      value: 80 + i * 25 + Math.floor(Math.random() * 60),
    }));

    const monthNames = ['December', 'November', 'October', 'September', 'August'];
    const paymentHistory = monthNames.map((month, i) => ({
      month,
      statementBalance: 800 + Math.floor(Math.random() * 400),
      amountPaid: 700 + Math.floor(Math.random() * 300),
      paymentStatus: (i === 3 ? 'Late' : 'On Time') as 'On Time' | 'Late' | 'Missed',
      peakUsage: 900 + Math.floor(Math.random() * 500),
      utilizationPercentage: 18 + Math.floor(Math.random() * 30),
      alerts: i === 0 || i === 1 ? 'High Usage' : '-',
    }));

    const totalSpending = spendingChartData.reduce((sum, data) => sum + data.value, 0);
    const averageSpending = Math.floor(totalSpending / months.length);

    return {
      totalCreditAvailable,
      totalAmountOwed,
      creditUtilizationRate,
      cardBalances,
      paymentHistory,
      utilizationChartData,
      spendingChartData,
      averageSpending,
    };
  }

  /**
   * Get credit analysis data from API
   */
  async getCreditAnalysisData(): Promise<CreditAnalysisData> {
    try {
      const response = await fetch('/api/cards/analysis');
      
      if (!response.ok) {
        console.error('Failed to fetch credit analysis, using demo data');
        // Return demo data based on a reasonable card count
        return this.generateDemoAnalysisData(3);
      }

      const result = await response.json();
      
      // If we got an error or empty data, return demo data
      if (!result.success || !result.data || result.data.cardBalances?.length === 0) {
        return this.generateDemoAnalysisData(3);
      }
      
      return result.data;
    } catch (error) {
      console.error('Error fetching credit analysis:', error);
      // Return demo data on error
      return this.generateDemoAnalysisData(3);
    }
  }
}

// Export singleton instance
export const cardService = new CardService();
