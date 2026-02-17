/**
 * API Route: GET /api/cards/analysis
 * Get credit analysis data for all connected cards
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';
import type { CreditAnalysisData, CardBalance, PaymentHistoryRow, ChartDataPoint } from '@/types/card.types';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        createErrorResponse('UNAUTHORIZED', 'Authentication required'),
        { status: 401 }
      );
    }

    // Fetch all active cards with their credit data
    const { data: cards, error: cardsError } = await supabase
      .from('connected_credit_cards')
      .select(`
        *,
        credit_data:credit_data_cache(*)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (cardsError) {
      console.error('Error fetching cards:', cardsError);
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to fetch cards'),
        { status: 500 }
      );
    }

    // Calculate aggregate metrics
    let totalCreditAvailable = 0;
    let totalAmountOwed = 0;
    const cardBalances: CardBalance[] = [];

    (cards || []).forEach((card: any) => {
      const creditData = Array.isArray(card.credit_data) && card.credit_data.length > 0 
        ? card.credit_data[0] 
        : null;

      if (creditData) {
        totalCreditAvailable += creditData.credit_limit || 0;
        totalAmountOwed += creditData.current_balance || 0;
        
        cardBalances.push({
          name: `${card.institution_name} ${card.card_last_four}`,
          balance: creditData.current_balance || 0,
        });
      }
    });

    const creditUtilizationRate = totalCreditAvailable > 0 
      ? Math.round((totalAmountOwed / totalCreditAvailable) * 100 * 100) / 100 
      : 0;

    // Fetch historical data for charts (last 12 months)
    const { data: historyData } = await supabase
      .from('credit_data_cache')
      .select('*')
      .in('card_id', (cards || []).map((c: any) => c.id))
      .order('synced_at', { ascending: true })
      .limit(12 * (cards?.length || 1));

    // Aggregate data by month for charts
    const monthlyData = new Map<string, { balance: number, spending: number, count: number }>();
    
    if (historyData) {
      historyData.forEach((record: any) => {
        const date = new Date(record.synced_at);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        
        const existing = monthlyData.get(monthKey) || { balance: 0, spending: 0, count: 0 };
        monthlyData.set(monthKey, {
          balance: existing.balance + record.current_balance,
          spending: existing.spending + record.current_balance, // Simplified - ideally track actual spending
          count: existing.count + 1,
        });
      });
    }

    // Generate chart data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const utilizationChartData: ChartDataPoint[] = months.map(month => ({
      label: month,
      value: Math.round(monthlyData.get(month)?.balance || 0),
    }));

    const spendingChartData: ChartDataPoint[] = months.map(month => ({
      label: month,
      value: Math.round(monthlyData.get(month)?.spending || 0),
    }));

    // Calculate average spending
    const totalSpending = Array.from(monthlyData.values()).reduce((sum, data) => sum + data.spending, 0);
    const averageSpending = monthlyData.size > 0 ? Math.round(totalSpending / monthlyData.size) : 0;

    // Generate payment history (last 5 months)
    const paymentHistory: PaymentHistoryRow[] = historyData
      ? historyData.slice(-5).map((record: any) => {
          const date = new Date(record.synced_at);
          const monthName = date.toLocaleDateString('en-US', { month: 'long' });
          
          return {
            month: monthName,
            statementBalance: record.current_balance,
            amountPaid: record.last_payment_amount || 0,
            paymentStatus: 'On Time' as const, // TODO: Determine from payment date vs due date
            peakUsage: record.current_balance,
            utilizationPercentage: record.utilization_percentage,
            alerts: record.utilization_percentage > 30 ? 'High Usage' : '-',
          };
        })
      : [];

    const analysisData: CreditAnalysisData = {
      totalCreditAvailable,
      totalAmountOwed,
      creditUtilizationRate,
      cardBalances,
      paymentHistory,
      utilizationChartData,
      spendingChartData,
      averageSpending,
    };

    return NextResponse.json(
      createSuccessResponse(analysisData),
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching credit analysis:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to fetch credit analysis data'),
      { status: 500 }
    );
  }
}
