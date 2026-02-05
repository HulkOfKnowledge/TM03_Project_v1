/**
 * Demo Data Service
 * Provides read-only access to demo tables for proof-of-concept UI
 */

import { createAdminClient } from '@/lib/supabase/admin';

export interface DemoUser {
  id: string;
  full_name: string;
  email: string;
  preferred_language: string;
  created_at: string;
}

export interface DemoCard {
  id: string;
  user_id: string;
  institution_name: string;
  card_name: string;
  card_last_four: string;
  card_network: 'visa' | 'mastercard' | 'amex' | 'other';
  credit_limit: number;
  current_balance: number;
  available_credit: number;
  utilization_percentage: number;
  minimum_payment: number;
  payment_due_date: string | null;
  interest_rate: number | null;
  is_active: boolean;
  opened_at: string | null;
  created_at: string;
}

export interface DemoTransaction {
  id: string;
  card_id: string;
  posted_at: string;
  amount: number;
  merchant: string;
  category: string;
  type: 'purchase' | 'refund';
  currency: string;
  description: string | null;
}

export interface DemoPayment {
  id: string;
  card_id: string;
  payment_date: string;
  amount: number;
  status: 'posted' | 'pending';
  method: 'bank_transfer' | 'debit' | 'bill_pay';
  confirmation_ref: string | null;
}

export interface DemoRecommendation {
  id: string;
  user_id: string;
  type: 'recommendation' | 'alert' | 'tip';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  message: string;
  action_required: boolean;
  created_at: string;
}

export interface DemoDashboardSummary {
  total_balance: number;
  total_limit: number;
  total_available: number;
  total_utilization: number;
  next_due_date: string | null;
  upcoming_payment_total: number;
}

export interface DemoDashboardData {
  user: DemoUser;
  cards: DemoCard[];
  transactions: DemoTransaction[];
  payments: DemoPayment[];
  recommendations: DemoRecommendation[];
  summary: DemoDashboardSummary;
}

export class DemoDataService {
  private getClient() {
    return createAdminClient();
  }

  async getDashboardData(): Promise<DemoDashboardData> {
    const supabase = this.getClient();

    const { data: users, error: userError } = await supabase
      .from('demo_users')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(1);

    if (userError || !users || users.length === 0) {
      throw new Error(userError?.message ?? 'Demo user not found');
    }

    const user = users[0] as DemoUser;

    const { data: cards, error: cardError } = await supabase
      .from('demo_cards')
      .select('*')
      .eq('user_id', user.id)
      .order('payment_due_date', { ascending: true });

    if (cardError) {
      throw new Error(cardError.message ?? 'Failed to load demo cards');
    }

    const cardList = (cards ?? []) as DemoCard[];
    const cardIds = cardList.map((card) => card.id);

    const { data: transactions, error: transactionError } = await supabase
      .from('demo_transactions')
      .select('*')
      .in('card_id', cardIds.length > 0 ? cardIds : ['00000000-0000-0000-0000-000000000000'])
      .order('posted_at', { ascending: false })
      .limit(40);

    if (transactionError) {
      throw new Error(transactionError.message ?? 'Failed to load demo transactions');
    }

    const { data: payments, error: paymentError } = await supabase
      .from('demo_payments')
      .select('*')
      .in('card_id', cardIds.length > 0 ? cardIds : ['00000000-0000-0000-0000-000000000000'])
      .order('payment_date', { ascending: false })
      .limit(20);

    if (paymentError) {
      throw new Error(paymentError.message ?? 'Failed to load demo payments');
    }

    const { data: recommendations, error: recError } = await supabase
      .from('demo_recommendations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (recError) {
      throw new Error(recError.message ?? 'Failed to load demo recommendations');
    }

    const totalLimit = cardList.reduce(
      (sum, card) => sum + Number(card.credit_limit || 0),
      0
    );
    const totalBalance = cardList.reduce(
      (sum, card) => sum + Number(card.current_balance || 0),
      0
    );
    const totalAvailable = cardList.reduce(
      (sum, card) => sum + Number(card.available_credit || 0),
      0
    );

    const totalUtilization = totalLimit > 0 ? (totalBalance / totalLimit) * 100 : 0;

    const upcomingPayments = cardList
      .filter((card) => Boolean(card.payment_due_date))
      .map((card) => ({
        dueDate: card.payment_due_date as string,
        amount: Number(card.minimum_payment || 0),
      }))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    const summary: DemoDashboardSummary = {
      total_balance: Number(totalBalance.toFixed(2)),
      total_limit: Number(totalLimit.toFixed(2)),
      total_available: Number(totalAvailable.toFixed(2)),
      total_utilization: Number(totalUtilization.toFixed(2)),
      next_due_date: upcomingPayments.length > 0 ? upcomingPayments[0].dueDate : null,
      upcoming_payment_total: Number(
        upcomingPayments.reduce((sum, item) => sum + item.amount, 0).toFixed(2)
      ),
    };

    return {
      user,
      cards: cardList,
      transactions: (transactions ?? []) as DemoTransaction[],
      payments: (payments ?? []) as DemoPayment[],
      recommendations: (recommendations ?? []) as DemoRecommendation[],
      summary,
    };
  }
}

export const demoDataService = new DemoDataService();
