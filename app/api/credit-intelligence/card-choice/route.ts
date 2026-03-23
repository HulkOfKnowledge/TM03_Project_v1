/**
 * API Route: POST /api/credit-intelligence/card-choice
 * MDP-based recommendation of which card to use at a merchant.
 */

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';

type RewardRateMap = Record<string, number>;

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  groceries: ['grocery', 'supermarket', 'food basics', 'costco', 'loblaws', 'metro', 'sobeys'],
  gas: ['gas', 'fuel', 'shell', 'esso', 'petro', 'ultramar', 'chevron'],
  dining: ['restaurant', 'cafe', 'coffee', 'tim hortons', 'mcdonald', 'ubereats', 'uber eats', 'doordash'],
  shopping: ['amazon', 'walmart', 'best buy', 'winners', 'mall', 'retail'],
  travel: ['air', 'flight', 'hotel', 'airbnb', 'uber', 'lyft', 'expedia'],
  entertainment: ['netflix', 'spotify', 'cineplex', 'steam', 'itunes', 'disney'],
  bills: ['hydro', 'internet', 'phone', 'insurance', 'bill', 'utility', 'rogers', 'bell'],
  healthcare: ['pharmacy', 'clinic', 'dental', 'hospital', 'vision', 'med'],
  education: ['tuition', 'course', 'university', 'college', 'bookstore', 'udemy'],
};

function normalizeCategory(value: string | null | undefined): string {
  if (!value) return 'other';
  const text = value.trim().toLowerCase();
  if (Object.prototype.hasOwnProperty.call(CATEGORY_KEYWORDS, text)) {
    return text;
  }
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return category;
    }
  }
  return 'other';
}

function heuristicCurrentRate(institution: string, category: string): number {
  const inst = institution.toLowerCase();
  if (inst.includes('amex') && ['dining', 'groceries', 'travel'].includes(category)) return 0.03;
  if (inst.includes('tangerine')) return 0.02;
  if (inst.includes('scotia') && ['groceries', 'gas', 'bills'].includes(category)) return 0.02;
  return 0.01;
}

function offerRewardRateByCategory(offer: any, category: string): number {
  const raw = category === 'groceries'
    ? Number(offer.earn_rate_grocery ?? offer.earn_rate_other ?? 0)
    : category === 'travel'
      ? Number(offer.earn_rate_travel ?? offer.earn_rate_other ?? 0)
      : category === 'dining'
        ? Number(offer.earn_rate_dining ?? offer.earn_rate_other ?? 0)
        : Number(offer.earn_rate_other ?? 0);

  // Offer table stores values like 3.0 (3%) for many cards; convert to decimal.
  return raw > 1 ? raw / 100 : raw;
}

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
    const rewardRatesByCard = (body?.rewardRatesByCard ?? {}) as Record<string, RewardRateMap>;

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
          estimated_reward_rate_by_category: rewardRatesByCard[card.id] ?? undefined,
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

    const normalizedMerchantCategory = normalizeCategory(response.data.merchant_category ?? merchantCategory ?? merchantName);
    const purchases = (txns || []).map((txn: any) => ({
      amount: txn.debit ?? 0,
      category: normalizeCategory(txn.raw_category ?? txn.description),
    }));

    const categorySpendTotal = purchases
      .filter((txn) => txn.amount > 0 && txn.category === normalizedMerchantCategory)
      .reduce((sum, txn) => sum + txn.amount, 0);
    const estimatedMonthlySpend = Number((categorySpendTotal * (30 / Math.max(30, Math.min(730, lookbackDays)))).toFixed(2));

    const currentBestRewardRate = candidateCards.reduce((best: number, card: any) => {
      const explicitRate = rewardRatesByCard[card.card_id]?.[normalizedMerchantCategory]
        ?? rewardRatesByCard[card.card_id]?.default;
      const rate = explicitRate != null
        ? Number(explicitRate)
        : heuristicCurrentRate(card.institution_name, normalizedMerchantCategory);
      return Math.max(best, rate);
    }, 0);

    const { data: offers } = await supabase
      .from('credit_card_offers')
      .select('name, issuer, earn_rate_grocery, earn_rate_travel, earn_rate_dining, earn_rate_other')
      .eq('is_active', true)
      .limit(100);

    let upgradeOpportunity: any = null;
    if (offers && offers.length > 0) {
      let bestOffer: any = null;
      let bestRate = 0;
      for (const offer of offers) {
        const rate = offerRewardRateByCategory(offer, normalizedMerchantCategory);
        if (rate > bestRate) {
          bestRate = rate;
          bestOffer = offer;
        }
      }

      if (bestOffer && bestRate > currentBestRewardRate) {
        const monthlyIncremental = estimatedMonthlySpend * (bestRate - currentBestRewardRate);
        upgradeOpportunity = {
          topSpendCategory: normalizedMerchantCategory,
          estimatedMonthlySpend,
          currentBestRewardRate: Number(currentBestRewardRate.toFixed(4)),
          suggestedOfferName: bestOffer.name,
          suggestedOfferIssuer: bestOffer.issuer,
          suggestedOfferRewardRate: Number(bestRate.toFixed(4)),
          estimatedMonthlyIncrementalReward: Number(monthlyIncremental.toFixed(2)),
          estimatedAnnualIncrementalReward: Number((monthlyIncremental * 12).toFixed(2)),
        };
      }
    }

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
      upgradeOpportunity,
      computedAt: response.data.computed_at,
    };

    return NextResponse.json(createSuccessResponse(payload), { status: 200 });
  } catch (error) {
    console.error('Error getting card choice recommendation:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to compute card choice recommendation'),
      { status: 500 }
    );
  }
}
