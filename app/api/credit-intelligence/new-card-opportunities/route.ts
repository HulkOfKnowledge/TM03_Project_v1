/**
 * API Route: POST /api/credit-intelligence/new-card-opportunities
 * Scenario 2 recommendations for external cards user does not currently own.
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
    const boundedLookbackDays = Math.max(30, Math.min(730, lookbackDays));

    const { data: cards, error: cardsError } = await supabase
      .from('connected_credit_cards')
      .select(`
        id,
        institution_name,
        credit_data_cache (
          current_balance,
          credit_limit,
          utilization_percentage,
          minimum_payment,
          payment_due_date,
          interest_rate
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (cardsError) {
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to load cards'),
        { status: 500 }
      );
    }

    if (!cards || cards.length === 0) {
      return NextResponse.json(createSuccessResponse({ userId: user.id, opportunities: [], computedAt: new Date().toISOString() }), { status: 200 });
    }

    const candidateCards = cards
      .map((card: any) => {
        const cache = Array.isArray(card.credit_data_cache)
          ? card.credit_data_cache[0]
          : card.credit_data_cache;
        if (!cache) {
          return null;
        }

        return {
          card_id: card.id,
          institution_name: card.institution_name,
          current_balance: cache.current_balance,
          credit_limit: cache.credit_limit,
          utilization_percentage: cache.utilization_percentage,
          minimum_payment: cache.minimum_payment,
          payment_due_date: cache.payment_due_date,
          interest_rate: cache.interest_rate,
        };
      })
      .filter(Boolean);

    if (candidateCards.length === 0) {
      return NextResponse.json(createSuccessResponse({ userId: user.id, opportunities: [], computedAt: new Date().toISOString() }), { status: 200 });
    }

    const minDate = new Date();
    minDate.setDate(minDate.getDate() - boundedLookbackDays);

    const { data: txns, error: txError } = await supabase
      .from('card_transactions')
      .select('id, card_id, date, description, debit, credit, raw_category, balance')
      .in('card_id', candidateCards.map((c: any) => c.card_id))
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
      `${pythonApiUrl}/api/v1/new-card-opportunities`,
      {
        user_id: user.id,
        lookback_days: boundedLookbackDays,
        cards: candidateCards,
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
      opportunities: Array.isArray(response.data.opportunities)
        ? response.data.opportunities.map((item: any) => ({
            topSpendCategory: item.top_spend_category,
            estimatedMonthlySpend: item.estimated_monthly_spend,
            spendSharePercentage: item.spend_share_percentage,
            currentBestRewardRate: item.current_best_reward_rate,
            suggestedOfferId: item.suggested_offer_id,
            suggestedOfferName: item.suggested_offer_name,
            suggestedOfferIssuer: item.suggested_offer_issuer,
            suggestedOfferRewardRate: item.suggested_offer_reward_rate,
            estimatedMonthlyIncrementalReward: item.estimated_monthly_incremental_reward,
            estimatedAnnualIncrementalReward: item.estimated_annual_incremental_reward,
            annualFee: item.annual_fee,
            suggestedOffers: item.suggested_offers,
            insightMessage: item.insight_message,
          }))
        : [],
      computedAt: response.data.computed_at,
    };

    return NextResponse.json(createSuccessResponse(payload), { status: 200 });
  } catch (error) {
    if (error instanceof AxiosError) {
      return NextResponse.json(
        createErrorResponse('UPSTREAM_ERROR', 'Failed to load new-card opportunities from intelligence service', {
          status: error.response?.status,
          detail: error.response?.data,
        }),
        { status: 502 }
      );
    }

    console.error('Error getting new card opportunities:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to compute new-card opportunities'),
      { status: 500 }
    );
  }
}
