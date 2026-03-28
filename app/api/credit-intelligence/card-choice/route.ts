/**
 * API Route: POST /api/credit-intelligence/card-choice
 * MDP-based recommendation of which card to use at a merchant.
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
    const merchantName = typeof body?.merchantName === 'string' ? body.merchantName.trim() : '';
    const merchantCategory = typeof body?.merchantCategory === 'string' ? body.merchantCategory : null;
    const estimatedAmount = Number(body?.estimatedAmount ?? 50);
    const lookbackDays = Number(body?.lookbackDays ?? 180);

    if (!merchantName) {
      return NextResponse.json(
        createErrorResponse('VALIDATION_ERROR', 'merchantName is required'),
        { status: 400 }
      );
    }

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
      return NextResponse.json(
        createErrorResponse('NO_DATA', 'No active cards found'),
        { status: 404 }
      );
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
      return NextResponse.json(
        createErrorResponse('NO_DATA', 'No card financial data found'),
        { status: 404 }
      );
    }

    const minDate = new Date();
    minDate.setDate(minDate.getDate() - Math.max(30, Math.min(730, lookbackDays)));

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
      `${pythonApiUrl}/api/v1/card-choice`,
      {
        user_id: user.id,
        merchant_name: merchantName,
        merchant_category: merchantCategory,
        estimated_amount: estimatedAmount,
        lookback_days: lookbackDays,
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
      merchantName: response.data.merchant_name,
      merchantCategory: response.data.merchant_category,
      recommendedCardId: response.data.recommended_card_id,
      policyReasoning: response.data.policy_reasoning,
      actionValues: response.data.action_values.map((value: any) => ({
        cardId: value.card_id,
        qValue: value.q_value,
        immediateReward: value.immediate_reward,
        expectedNextValue: value.expected_next_value,
        estimatedPostUtilization: value.estimated_post_utilization,
      })),
      counterfactual: {
        baselineCardId: response.data.counterfactual?.baseline_card_id ?? null,
        recommendedCardId: response.data.counterfactual?.recommended_card_id,
        estimatedRewardBaseline: response.data.counterfactual?.estimated_reward_baseline,
        estimatedRewardRecommended: response.data.counterfactual?.estimated_reward_recommended,
        estimatedIncrementalReward: response.data.counterfactual?.estimated_incremental_reward,
        estimatedMonthlyIncrementalReward: response.data.counterfactual?.estimated_monthly_incremental_reward,
        estimatedAnnualIncrementalReward: response.data.counterfactual?.estimated_annual_incremental_reward,
      },
      upgradeOpportunity: response.data.upgrade_opportunity ?? null,
      computedAt: response.data.computed_at,
    };

    return NextResponse.json(createSuccessResponse(payload), { status: 200 });
  } catch (error) {
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const detail = (error.response?.data as any)?.detail;
      const errorCode = typeof detail?.code === 'string' ? detail.code : null;
      const errorMessage = typeof detail?.message === 'string' ? detail.message : null;

      if (status === 422 && errorCode === 'NO_REWARD_DATA') {
        return NextResponse.json(
          createErrorResponse('NO_REWARD_DATA', errorMessage || 'No benefit to card yet', {
            skippedCards: detail?.skipped_cards,
          }),
          { status: 422 }
        );
      }
    }

    console.error('Error getting card choice recommendation:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to compute card choice recommendation'),
      { status: 500 }
    );
  }
}
