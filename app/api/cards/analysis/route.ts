/**
 * API Route: GET /api/cards/analysis
 * Get credit analysis data for all connected cards
 * Includes ML-powered insights from Credit Intelligence Service
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';
import type { CreditAnalysisData, CardBalance, PaymentHistoryRow, ChartDataPoint, CardChartData } from '@/types/card.types';
import axios from 'axios';

export const dynamic = 'force-dynamic';

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

    // Fetch historical data for charts (last 12 months - always return full dataset)
    const { data: historyData } = await supabase
      .from('credit_data_cache')
      .select('*')
      .in('card_id', (cards || []).map((c: any) => c.id))
      .order('synced_at', { ascending: true })
      .limit(12 * (cards?.length || 1));

    // Always return all 12 months - filtering will be done client-side
    const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const months = allMonths;
    
    // Organize data per card
    const utilizationChartData: CardChartData[] = [];
    const spendingChartData: CardChartData[] = [];
    
    // Process data for each card separately
    (cards || []).forEach((card: any) => {
      const cardName = `${card.institution_name} ****${card.card_last_four}`;
      const cardHistoryData = (historyData || []).filter((h: any) => h.card_id === card.id);
      
      // Aggregate by month for this card
      const cardMonthlyData = new Map<string, { utilization: number, balance: number, count: number }>();
      
      cardHistoryData.forEach((record: any) => {
        const date = new Date(record.synced_at);
        const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
        
        const existing = cardMonthlyData.get(monthKey) || { utilization: 0, balance: 0, count: 0 };
        cardMonthlyData.set(monthKey, {
          utilization: Math.max(existing.utilization, record.utilization_percentage || 0),
          balance: Math.max(existing.balance, record.current_balance || 0),
          count: existing.count + 1,
        });
      });
      
      // Generate utilization chart data for this card (percentage)
      const cardUtilizationData: ChartDataPoint[] = months.map(month => ({
        label: month,
        value: Math.round(cardMonthlyData.get(month)?.utilization || 0),
      }));
      
      utilizationChartData.push({
        cardId: card.id,
        cardName,
        data: cardUtilizationData,
      });
      
      // Generate spending chart data for this card (balance in dollars)
      const cardSpendingData: ChartDataPoint[] = months.map(month => ({
        label: month,
        value: Math.round(cardMonthlyData.get(month)?.balance || 0),
      }));
      
      spendingChartData.push({
        cardId: card.id,
        cardName,
        data: cardSpendingData,
      });
    });

    // Calculate average spending across all cards
    const totalSpending = spendingChartData.reduce((sum, cardData) => {
      return sum + cardData.data.reduce((s, d) => s + d.value, 0);
    }, 0);
    const totalMonths = spendingChartData.length * months.length;
    const averageSpending = totalMonths > 0 ? Math.round(totalSpending / totalMonths) : 0;

    // Generate payment history (per-card data for each month)
    const paymentHistoryMap = new Map<string, Map<string, {
      balance: number,
      paid: number,
      peakUsage: number,
      utilizationPercentage: number,
    }>>();
    
    if (historyData) {
      historyData.forEach((record: any) => {
        const date = new Date(record.synced_at);
        const monthName = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        const card = (cards || []).find((c: any) => c.id === record.card_id);
        const cardName = card ? `${card.institution_name} ****${card.card_last_four}` : 'Unknown';
        
        if (!paymentHistoryMap.has(cardName)) {
          paymentHistoryMap.set(cardName, new Map());
        }
        
        const cardHistory = paymentHistoryMap.get(cardName)!;
        const existing = cardHistory.get(monthName) || {
          balance: 0,
          paid: 0,
          peakUsage: 0,
          utilizationPercentage: 0,
        };
        
        cardHistory.set(monthName, {
          balance: Math.max(existing.balance, record.current_balance || 0),
          paid: existing.paid + (record.last_payment_amount || 0),
          peakUsage: Math.max(existing.peakUsage, record.current_balance || 0),
          utilizationPercentage: Math.max(existing.utilizationPercentage, record.utilization_percentage || 0),
        });
      });
    }
    
    // Flatten to array with card names - return all available history
    const paymentHistory: PaymentHistoryRow[] = [];
    paymentHistoryMap.forEach((cardHistory, cardName) => {
      Array.from(cardHistory.entries()).forEach(([month, data]) => {
        // ML-based alert generation (matching credit intelligence service zones)
        let alerts = '-';
        if (data.utilizationPercentage > 30) {
          alerts = 'High utilization';
        } else if (data.utilizationPercentage > 25) {
          alerts = 'Caution: Monitor closely';
        } else if (data.utilizationPercentage > 0) {
          alerts = 'Safe';
        }
        
        paymentHistory.push({
          month,
          cardName,
          statementBalance: Math.round(data.balance),
          amountPaid: Math.round(data.paid),
          paymentStatus: data.paid >= data.balance * 0.9 ? 'On Time' as const : 'Late' as const,
          peakUsage: Math.round(data.peakUsage),
          utilizationPercentage: Math.round(data.utilizationPercentage),
          alerts,
        });
      });
    });

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

    // Get ML-powered insights from Credit Intelligence Service
    let mlInsights = null;
    try {
      const pythonApiUrl = process.env.CREDIT_INTELLIGENCE_API_URL || 'http://localhost:8000';
      const mlResponse = await axios.post(
        `${pythonApiUrl}/api/v1/analyze`,
        {
          user_id: user.id,
          cards: (cards || []).map((card: any) => {
            const creditData = Array.isArray(card.credit_data) && card.credit_data.length > 0 
              ? card.credit_data[0] 
              : null;
            
            return {
              card_id: card.id,
              institution_name: card.institution_name,
              current_balance: creditData?.current_balance || 0,
              credit_limit: creditData?.credit_limit || 0,
              utilization_percentage: creditData?.utilization_percentage || 0,
              minimum_payment: creditData?.minimum_payment || 0,
              payment_due_date: creditData?.payment_due_date || null,
              interest_rate: creditData?.interest_rate || 19.99,
              last_payment_amount: creditData?.last_payment_amount || 0,
              last_payment_date: creditData?.last_payment_date || null,
            };
          }),
          timestamp: new Date().toISOString(),
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': process.env.CREDIT_INTELLIGENCE_API_KEY || '',
          },
          timeout: 10000, // 10 second timeout for insights
        }
      );

      mlInsights = {
        overallScore: mlResponse.data.overall_score,
        insights: mlResponse.data.insights,
        recommendations: mlResponse.data.recommendations,
      };
    } catch (mlError) {
      // Log error but don't fail the entire request
      console.error('Failed to fetch ML insights:', mlError);
      // Continue without ML insights
    }

    return NextResponse.json(
      createSuccessResponse({
        ...analysisData,
        mlInsights, // Add ML insights to the response
      }),
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
