/**
 * API Route: POST /api/credit-intelligence/forecast-insights
 * Server-side Smart Forecast intelligence payload for UI consumption.
 */

import { NextRequest, NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';

import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        createErrorResponse('UNAUTHORIZED', 'Authentication required'),
        { status: 401 }
      );
    }

    const body = await request.json();
    const startDate = typeof body?.startDate === 'string' ? body.startDate : null;
    const endDate = typeof body?.endDate === 'string' ? body.endDate : null;
    const cardIdFilter = typeof body?.cardId === 'string' ? body.cardId : null;
    const cardIdsFilter = Array.isArray(body?.cardIds)
      ? body.cardIds.filter((id: unknown): id is string => typeof id === 'string' && id.length > 0)
      : [];

    if (!startDate || !endDate) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'startDate and endDate are required'),
        { status: 400 }
      );
    }

    const { data: cards, error: cardsError } = await supabase
      .from('connected_credit_cards')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (cardsError) {
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to load cards'),
        { status: 500 }
      );
    }

    const cardIds = (cards || []).map((c: { id: string }) => c.id);
    if (cardIds.length === 0) {
      return NextResponse.json(
        createSuccessResponse({
          userId: user.id,
          startDate,
          endDate,
          topCategories: [],
          anomaly: null,
          monthlyTrend: [],
          forecastSnapshot: null,
          computedAt: new Date().toISOString(),
        }),
        { status: 200 }
      );
    }

    let scopedCardIds = cardIdFilter ? cardIds.filter((id) => id === cardIdFilter) : cardIds;
    if (cardIdsFilter.length > 0) {
      const allowed = new Set(cardIdsFilter);
      scopedCardIds = scopedCardIds.filter((id) => allowed.has(id));
    }

    if (scopedCardIds.length === 0) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Requested card scope is invalid'),
        { status: 400 }
      );
    }

    const broadStart = new Date(startDate);
    broadStart.setMonth(broadStart.getMonth() - 12);

    const { data: txns, error: txError } = await supabase
      .from('card_transactions')
      .select('id, card_id, date, description, debit, credit, raw_category, balance')
      .in('card_id', scopedCardIds)
      .gte('date', broadStart.toISOString().slice(0, 10))
      .lte('date', endDate)
      .order('date', { ascending: true })
      .limit(10000);

    if (txError) {
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to load transactions'),
        { status: 500 }
      );
    }

    const pythonApiUrl = process.env.CREDIT_INTELLIGENCE_API_URL || 'http://localhost:8000';
    const response = await axios.post(
      `${pythonApiUrl}/api/v1/forecast-insights`,
      {
        user_id: user.id,
        start_date: startDate,
        end_date: endDate,
        current_date: new Date().toISOString().slice(0, 10),
        transactions: (txns || []).map((txn: any) => ({
          id: txn.id,
          card_id: txn.card_id,
          date: txn.date,
          description: txn.description,
          amount: txn.debit ?? (txn.credit != null ? -txn.credit : 0),
          category: txn.raw_category,
          merchant_name: null,
          balance: txn.balance,
        })),
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.CREDIT_INTELLIGENCE_API_KEY || '',
        },
        timeout: 60000,
      }
    );

    const payload = {
      userId: response.data.user_id,
      startDate: response.data.start_date,
      endDate: response.data.end_date,
      topCategories: Array.isArray(response.data.top_categories)
        ? response.data.top_categories.map((item: any) => ({
            category: item.category,
            amount: item.amount,
          }))
        : [],
      anomaly: response.data.anomaly
        ? {
            category: response.data.anomaly.category,
            averageMonthly: response.data.anomaly.average_monthly,
            monthToDate: response.data.anomaly.month_to_date,
            dayOfMonth: response.data.anomaly.day_of_month,
            baselineMonths: response.data.anomaly.baseline_months,
          }
        : null,
      categoryMomentum: Array.isArray(response.data.category_momentum)
        ? response.data.category_momentum.map((item: any) => ({
            category: item.category,
            currentAmount: item.current_amount,
            previousAmount: item.previous_amount,
            changePct: item.change_pct,
            direction: item.direction,
          }))
        : [],
      monthlyTrend: Array.isArray(response.data.monthly_trend)
        ? response.data.monthly_trend.map((item: any) => ({
            month: item.month,
            total: item.total,
          }))
        : [],
      forecastSnapshot: response.data.forecast_snapshot
        ? {
            mtdSpend: response.data.forecast_snapshot.mtd_spend,
            projectedMonthEnd: response.data.forecast_snapshot.projected_month_end,
            projectedLow: response.data.forecast_snapshot.projected_low,
            projectedHigh: response.data.forecast_snapshot.projected_high,
            confidence: response.data.forecast_snapshot.confidence,
            status: response.data.forecast_snapshot.status,
            dayOfMonth: response.data.forecast_snapshot.day_of_month,
            monthDays: response.data.forecast_snapshot.month_days,
          }
        : null,
      nextSpendPrediction: response.data.next_spend_prediction
        ? {
            currentCategory: response.data.next_spend_prediction.current_category,
            topCategory: response.data.next_spend_prediction.top_category,
            probabilities: Array.isArray(response.data.next_spend_prediction.probabilities)
              ? response.data.next_spend_prediction.probabilities.map((item: any) => ({
                  category: item.category,
                  probability: item.probability,
                }))
              : [],
          }
        : null,
      actionPlan: response.data.action_plan
        ? {
            summary: response.data.action_plan.summary,
            items: Array.isArray(response.data.action_plan.items)
              ? response.data.action_plan.items.map((item: any) => ({
                  id: item.id,
                  priority: item.priority,
                  title: item.title,
                  description: item.description,
                  rationale: item.rationale,
                  actionType: item.action_type,
                }))
              : [],
          }
        : null,
      computedAt: response.data.computed_at,
    };

    return NextResponse.json(createSuccessResponse(payload), { status: 200 });
  } catch (error) {
    if (error instanceof AxiosError) {
      return NextResponse.json(
        createErrorResponse('UPSTREAM_ERROR', 'Failed to compute forecast insights', {
          status: error.response?.status,
          detail: error.response?.data,
        }),
        { status: 502 }
      );
    }

    console.error('Error getting forecast insights:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to compute forecast insights'),
      { status: 500 }
    );
  }
}
