import { NextRequest, NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';

import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';
import type { NotificationTimeframe, RewardNotification } from '@/types/notification.types';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOTIFICATION_EVAL_LIMIT = 120;

function bucketByTimeframe(date: Date, now: Date): NotificationTimeframe | null {
  const ageMs = now.getTime() - date.getTime();
  if (ageMs < 0) return null;
  if (ageMs <= DAY_MS) return 'daily';
  if (ageMs <= 7 * DAY_MS) return 'weekly';
  if (ageMs <= 30 * DAY_MS) return 'monthly';
  return null;
}

function cardLabel(card: { institutionName: string; lastFour: string | null }): string {
  const suffix = card.lastFour ? ` **** ${card.lastFour}` : '';
  return `${card.institutionName}${suffix}`;
}

function buildTitle(incrementalReward: number): string {
  if (incrementalReward >= 10) return 'High-value rewards switch found';
  if (incrementalReward >= 3) return 'Better rewards option detected';
  return 'You could have earned more';
}

function buildMessage(params: {
  amount: number;
  merchant: string;
  recommendedCardLabel: string;
  baselineCardLabel: string;
  incrementalReward: number;
}): string {
  const { amount, merchant, recommendedCardLabel, baselineCardLabel, incrementalReward } = params;
  return `For this $${amount.toFixed(2)} purchase at ${merchant}, ${recommendedCardLabel} could have earned about $${incrementalReward.toFixed(2)} more than ${baselineCardLabel}.`;
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        createErrorResponse('UNAUTHORIZED', 'Authentication required'),
        { status: 401 }
      );
    }

    const { data: cards, error: cardsError } = await supabase
      .from('connected_credit_cards')
      .select(`
        id,
        institution_name,
        card_last_four,
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
        createErrorResponse('DATABASE_ERROR', 'Failed to fetch cards'),
        { status: 500 }
      );
    }

    if (!cards || cards.length === 0) {
      return NextResponse.json(
        createSuccessResponse({ unreadCount: 0, daily: [], weekly: [], monthly: [] }),
        { status: 200 }
      );
    }

    const cardMetadata = cards.map((card: any) => ({
      id: card.id,
      institutionName: card.institution_name,
      lastFour: card.card_last_four,
    }));
    const cardById = new Map(cardMetadata.map((card) => [card.id, card]));

    const candidateCards = cards
      .map((card: any) => {
        const cache = Array.isArray(card.credit_data_cache)
          ? card.credit_data_cache[0]
          : card.credit_data_cache;

        if (!cache) return null;

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
        createSuccessResponse({ unreadCount: 0, daily: [], weekly: [], monthly: [] }),
        { status: 200 }
      );
    }

    const cardIds = candidateCards.map((card: any) => card.card_id);

    const minDate = new Date();
    minDate.setDate(minDate.getDate() - 30);

    const { data: txns, error: txError } = await supabase
      .from('card_transactions')
      .select('id, card_id, date, description, debit, credit, raw_category, balance')
      .in('card_id', cardIds)
      .gte('date', minDate.toISOString().slice(0, 10))
      .order('date', { ascending: false })
      .limit(5000);

    if (txError) {
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to fetch transactions'),
        { status: 500 }
      );
    }

    const transactions = txns || [];
    const now = new Date();

    const historyForPlanner = transactions.map((txn: any) => ({
      id: txn.id,
      card_id: txn.card_id,
      date: txn.date,
      description: txn.description,
      amount: txn.debit ?? (txn.credit != null ? -txn.credit : 0),
      category: txn.raw_category,
      merchant_name: null,
      balance: txn.balance,
    }));

    const transactionsToEvaluate = transactions
      .filter((txn: any) => Number(txn.debit ?? 0) > 0)
      .slice(0, NOTIFICATION_EVAL_LIMIT);

    const daily: RewardNotification[] = [];
    const weekly: RewardNotification[] = [];
    const monthly: RewardNotification[] = [];

    const pythonApiUrl = process.env.CREDIT_INTELLIGENCE_API_URL || 'http://localhost:8000';
    const pythonApiKey = process.env.CREDIT_INTELLIGENCE_API_KEY || '';
    const candidateCardIdSet = new Set(candidateCards.map((card: any) => String(card.card_id)));

    for (const txn of transactionsToEvaluate) {
      const txnDate = new Date(txn.date);
      if (Number.isNaN(txnDate.getTime())) continue;

      const timeframe = bucketByTimeframe(txnDate, now);
      if (!timeframe) continue;

      const baselineCard = cardById.get(txn.card_id);
      if (!baselineCard) continue;

      const amount = Number(txn.debit ?? 0);
      if (!Number.isFinite(amount) || amount <= 0) continue;

      try {
        const plannerResponse = await axios.post(
          `${pythonApiUrl}/api/v1/card-choice`,
          {
            user_id: user.id,
            merchant_name: txn.description || 'Unknown merchant',
            merchant_category: txn.raw_category,
            estimated_amount: amount,
            lookback_days: 180,
            cards: candidateCards,
            transactions: historyForPlanner,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': pythonApiKey,
            },
            timeout: 30000,
          }
        );

        const data = plannerResponse.data;
        const recommendedCardId = data?.recommended_card_id as string | undefined;
        const incrementalReward = Number(data?.counterfactual?.estimated_incremental_reward ?? 0);

        if (!recommendedCardId || recommendedCardId === baselineCard.id) continue;
        if (!Number.isFinite(incrementalReward) || incrementalReward <= 0) continue;

        const recommendedCard = cardById.get(recommendedCardId);
        if (!recommendedCard) continue;

        const baselineReward = Number(data?.counterfactual?.estimated_reward_baseline ?? 0);
        const recommendedReward = Number(data?.counterfactual?.estimated_reward_recommended ?? 0);

        const baselineRatePct = amount > 0 ? Number(((baselineReward / amount) * 100).toFixed(2)) : 0;
        const recommendedRatePct = amount > 0 ? Number(((recommendedReward / amount) * 100).toFixed(2)) : 0;

        const item: RewardNotification = {
          id: `${txn.id}-${timeframe}`,
          transactionId: txn.id,
          cardId: txn.card_id,
          timeframe,
          createdAt: now.toISOString(),
          transactionDate: txnDate.toISOString(),
          merchant: txn.description || 'Unknown merchant',
          category: String(data?.merchant_category || txn.raw_category || 'other'),
          amount: Number(amount.toFixed(2)),
          baselineCardId: baselineCard.id,
          baselineCardLabel: cardLabel(baselineCard),
          recommendedCardId,
          recommendedCardLabel: cardLabel(recommendedCard),
          baselineRate: baselineRatePct,
          recommendedRate: recommendedRatePct,
          incrementalReward: Number(incrementalReward.toFixed(2)),
          title: buildTitle(incrementalReward),
          message: buildMessage({
            amount,
            merchant: txn.description || 'Unknown merchant',
            recommendedCardLabel: cardLabel(recommendedCard),
            baselineCardLabel: cardLabel(baselineCard),
            incrementalReward,
          }),
          viewTransactionUrl: `/transactions/${txn.id}`,
        };

        if (timeframe === 'daily') daily.push(item);
        else if (timeframe === 'weekly') weekly.push(item);
        else monthly.push(item);
      } catch (error) {
        if (error instanceof AxiosError) {
          const status = error.response?.status;
          const detail = (error.response?.data as any)?.detail;
          if (status === 422 && detail?.code === 'NO_REWARD_DATA') {
            // Skip transactions where planner has no reward data or no positive benefit.
            const skippedCards = Array.isArray(detail?.skipped_cards)
              ? detail.skipped_cards.map((cardId: unknown) => String(cardId))
              : [];
            const skippedAllCards = skippedCards.length > 0
              && skippedCards.every((cardId: string) => candidateCardIdSet.has(cardId))
              && skippedCards.length >= candidateCardIdSet.size;

            if (skippedAllCards) {
              console.warn('Notifications reward optimization skipped: no reward data for all active cards', {
                userId: user.id,
                skippedCards,
              });
              break;
            }
            continue;
          }
        }
      }
    }

    const sortDesc = (a: RewardNotification, b: RewardNotification) =>
      new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime();

    daily.sort(sortDesc);
    weekly.sort(sortDesc);
    monthly.sort(sortDesc);

    const summary = {
      unreadCount: daily.length + weekly.length + monthly.length,
      daily,
      weekly,
      monthly,
    };

    return NextResponse.json(createSuccessResponse(summary), { status: 200 });
  } catch (error) {
    console.error('Error loading notifications:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to load notifications'),
      { status: 500 }
    );
  }
}
