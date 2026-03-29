/**
 * API Route: POST /api/credit-intelligence/spending-probability
 * Markov-chain probability of next spending category.
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
    const lookbackDays = Number(body?.lookbackDays ?? 180);
    const currentCategory = typeof body?.currentCategory === 'string' ? body.currentCategory : null;
    const cardIdFilter = typeof body?.cardId === 'string' ? body.cardId : null;

    const minDate = new Date();
    minDate.setDate(minDate.getDate() - Math.max(30, Math.min(730, lookbackDays)));

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
        createErrorResponse('NO_DATA', 'No active cards found'),
        { status: 404 }
      );
    }

    const scopedCardIds = cardIdFilter ? cardIds.filter((id) => id === cardIdFilter) : cardIds;
    if (scopedCardIds.length === 0) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'Requested card does not belong to user'),
        { status: 400 }
      );
    }

    const { data: txns, error: txError } = await supabase
      .from('card_transactions')
      .select('id, card_id, date, description, debit, credit, raw_category, balance')
      .in('card_id', scopedCardIds)
      .gte('date', minDate.toISOString().slice(0, 10))
      .order('date', { ascending: true })
      .limit(5000);

    if (txError) {
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to load transactions'),
        { status: 500 }
      );
    }

    const pythonApiUrl = process.env.CREDIT_INTELLIGENCE_API_URL || 'http://localhost:8000';
    const response = await axios.post(
      `${pythonApiUrl}/api/v1/spending-probability`,
      {
        user_id: user.id,
        current_category: currentCategory,
        lookback_days: lookbackDays,
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
      currentCategory: response.data.current_category,
      probabilities: response.data.probabilities.map((p: any) => ({
        category: p.category,
        probability: p.probability,
      })),
      topCategory: response.data.top_category,
      transitionCounts: response.data.transition_counts,
      computedAt: response.data.computed_at,
    };

    return NextResponse.json(createSuccessResponse(payload), { status: 200 });
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const detail = (error.response?.data as any)?.detail;
      const errorCode = typeof detail?.code === 'string' ? detail.code : null;
      const errorMessage = typeof detail?.message === 'string' ? detail.message : null;

      if (
        status === 422
        && (errorCode === 'INSUFFICIENT_SPENDING_HISTORY' || errorCode === 'INSUFFICIENT_CATEGORY_TRANSITIONS')
      ) {
        return NextResponse.json(
          createErrorResponse(errorCode, errorMessage || 'Insufficient data to compute spending probabilities', {
            details: detail?.details,
          }),
          { status: 422 }
        );
      }
    }

    console.error('Error getting spending probabilities:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to compute spending probabilities'),
      { status: 500 }
    );
  }
}
