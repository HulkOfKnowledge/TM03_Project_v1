import { NextRequest, NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';

import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';
import type {
  AppNotification,
  NotificationsSummary,
  NotificationTimeframe,
  RewardNotification,
} from '@/types/notification.types';

const DAY_MS = 24 * 60 * 60 * 1000;
const NOTIFICATION_EVAL_LIMIT = 120;
const NEW_CARD_OPPORTUNITIES_LOOKBACK_DAYS = 180;

interface NotificationProviderContext {
  userId: string;
  now: Date;
}

type NotificationProvider = (ctx: NotificationProviderContext) => Promise<AppNotification[]>;

interface CardChoiceOpportunity {
  top_spend_category: string;
  estimated_monthly_spend?: number;
  spend_share_percentage?: number;
  suggested_offer_id?: string;
  suggested_offer_name?: string | null;
  suggested_offer_issuer?: string | null;
  estimated_monthly_incremental_reward?: number;
  estimated_annual_incremental_reward?: number;
  annual_fee?: number | null;
}

interface CardChoicePlannerPayload {
  merchant_category?: string;
  recommended_card_id?: string;
  counterfactual?: {
    estimated_incremental_reward?: number;
    estimated_reward_baseline?: number;
    estimated_reward_recommended?: number;
  };
  owned_card_opportunity?: {
    used_card_id?: string;
    estimated_incremental_reward?: number;
    estimated_monthly_incremental_reward?: number;
    estimated_annual_incremental_reward?: number;
  };
}

interface NewCardOpportunitiesPayload {
  opportunities?: CardChoiceOpportunity[];
}

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

function buildNewCardOpportunityTitle(incrementalMonthlyReward: number): string {
  if (incrementalMonthlyReward >= 25) return 'High-value new card opportunity';
  if (incrementalMonthlyReward >= 10) return 'New card could boost your rewards';
  return 'Possible rewards upgrade detected';
}

function buildNewCardOpportunityMessage(params: {
  category: string;
  spendSharePct: number;
  suggestedOfferName: string;
  monthlyGain: number;
}): string {
  const { category, spendSharePct, suggestedOfferName, monthlyGain } = params;
  return `You spend about ${spendSharePct.toFixed(1)}% in ${category}. ${suggestedOfferName} could add about $${monthlyGain.toFixed(2)}/month in rewards with your current pattern.`;
}

function buildOwnedCardNotification(params: {
  txn: any;
  timeframe: NotificationTimeframe;
  nowIso: string;
  txnDateIso: string;
  amount: number;
  merchant: string;
  category: string;
  baselineCardId: string;
  baselineCardLabel: string;
  recommendedCardId: string;
  recommendedCardLabel: string;
  baselineRatePct: number;
  recommendedRatePct: number;
  incrementalReward: number;
  monthlyIncrementalReward: number;
  annualIncrementalReward: number;
}): RewardNotification {
  const {
    txn,
    timeframe,
    nowIso,
    txnDateIso,
    amount,
    merchant,
    category,
    baselineCardId,
    baselineCardLabel,
    recommendedCardId,
    recommendedCardLabel,
    baselineRatePct,
    recommendedRatePct,
    incrementalReward,
    monthlyIncrementalReward,
    annualIncrementalReward,
  } = params;

  return {
    id: `${txn.id}-${timeframe}`,
    kind: 'reward_optimization',
    optimizationType: 'owned_card_switch',
    transactionId: txn.id,
    cardId: txn.card_id,
    timeframe,
    createdAt: nowIso,
    eventDate: txnDateIso,
    merchant,
    category,
    amount: Number(amount.toFixed(2)),
    baselineCardId,
    baselineCardLabel,
    recommendedCardId,
    recommendedCardLabel,
    baselineRate: baselineRatePct,
    recommendedRate: recommendedRatePct,
    incrementalReward: Number(incrementalReward.toFixed(2)),
    estimatedMonthlyIncrementalReward: Number(monthlyIncrementalReward.toFixed(2)),
    estimatedAnnualIncrementalReward: Number(annualIncrementalReward.toFixed(2)),
    title: buildTitle(incrementalReward),
    message: buildMessage({
      amount,
      merchant,
      recommendedCardLabel,
      baselineCardLabel,
      incrementalReward,
    }),
    actionUrl: `/transactions/${txn.id}`,
    viewTransactionUrl: `/transactions/${txn.id}`,
  };
}

function buildNewCardNotification(params: {
  id: string;
  timeframe: NotificationTimeframe;
  nowIso: string;
  eventDateIso: string;
  amount: number;
  merchant: string;
  category: string;
  baselineCardId: string;
  baselineCardLabel: string;
  suggestedOfferId?: string;
  suggestedOfferName: string;
  suggestedOfferIssuer?: string | null;
  monthlyGain: number;
  annualGain: number;
  spendSharePct: number;
  estimatedMonthlySpend: number;
  annualFee?: number | null;
  actionUrl: string;
}): RewardNotification {
  const {
    id,
    timeframe,
    nowIso,
    eventDateIso,
    amount,
    merchant,
    category,
    baselineCardId,
    baselineCardLabel,
    suggestedOfferId,
    suggestedOfferName,
    suggestedOfferIssuer,
    monthlyGain,
    annualGain,
    spendSharePct,
    estimatedMonthlySpend,
    annualFee,
    actionUrl,
  } = params;

  const recommendedCardLabel = suggestedOfferIssuer
    ? `${suggestedOfferIssuer} ${suggestedOfferName}`
    : suggestedOfferName;

  return {
    id,
    kind: 'reward_optimization',
    optimizationType: 'new_card_opportunity',
    transactionId: id,
    cardId: baselineCardId,
    timeframe,
    createdAt: nowIso,
    eventDate: eventDateIso,
    merchant,
    category,
    amount: Number(amount.toFixed(2)),
    baselineCardId,
    baselineCardLabel,
    recommendedCardId: `external:${suggestedOfferName}`,
    recommendedOfferId: suggestedOfferId,
    recommendedCardLabel,
    baselineRate: 0,
    recommendedRate: 0,
    incrementalReward: Number(monthlyGain.toFixed(2)),
    estimatedMonthlyIncrementalReward: Number(monthlyGain.toFixed(2)),
    estimatedAnnualIncrementalReward: Number(annualGain.toFixed(2)),
    spendSharePercentage: Number(spendSharePct.toFixed(2)),
    estimatedMonthlySpend: Number(estimatedMonthlySpend.toFixed(2)),
    suggestedOfferIssuer: suggestedOfferIssuer ?? null,
    annualFee: annualFee ?? null,
    title: buildNewCardOpportunityTitle(monthlyGain),
    message: buildNewCardOpportunityMessage({
      category,
      spendSharePct,
      suggestedOfferName: recommendedCardLabel,
      monthlyGain,
    }),
    actionUrl,
    viewTransactionUrl: actionUrl,
  };
}

function emptySummary(): NotificationsSummary {
  return {
    unreadCount: 0,
    notifications: [],
    byKind: {
      reward_optimization: 0,
      system: 0,
      profile: 0,
      activity: 0,
    },
  };
}

function mergeNotificationsByTimeframe(notifications: AppNotification[]): NotificationsSummary {
  const summary = emptySummary();

  for (const notification of notifications) {
    summary.byKind[notification.kind] += 1;
    summary.notifications.push(notification);
  }

  const sortDesc = (a: AppNotification, b: AppNotification) =>
    new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();

  summary.notifications.sort(sortDesc);
  summary.unreadCount = summary.notifications.length;

  return summary;
}

async function getRewardOptimizationNotifications(ctx: NotificationProviderContext): Promise<RewardNotification[]> {
  const supabase = await createClient();

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
    .eq('user_id', ctx.userId)
    .eq('is_active', true);

  if (cardsError || !cards || cards.length === 0) {
    return [];
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
    return [];
  }

  const cardIds = candidateCards.map((card: any) => card.card_id);
  const minDate = new Date(ctx.now);
  minDate.setDate(minDate.getDate() - NEW_CARD_OPPORTUNITIES_LOOKBACK_DAYS);

  const { data: txns, error: txError } = await supabase
    .from('card_transactions')
    .select('id, card_id, date, description, debit, credit, raw_category, balance')
    .in('card_id', cardIds)
    .gte('date', minDate.toISOString().slice(0, 10))
    .order('date', { ascending: false })
    .limit(5000);

  if (txError) {
    return [];
  }

  const transactions = txns || [];
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

  const notifications: RewardNotification[] = [];
  const newCardOpportunityByKey = new Map<string, RewardNotification>();
  const pythonApiUrl = process.env.CREDIT_INTELLIGENCE_API_URL || 'http://localhost:8000';
  const pythonApiKey = process.env.CREDIT_INTELLIGENCE_API_KEY || '';
  const candidateCardIdSet = new Set(candidateCards.map((card: any) => String(card.card_id)));

  for (const txn of transactionsToEvaluate) {
    const txnDate = new Date(txn.date);
    if (Number.isNaN(txnDate.getTime())) continue;

    const timeframe = bucketByTimeframe(txnDate, ctx.now);
    if (!timeframe) continue;

    const baselineCard = cardById.get(txn.card_id);
    if (!baselineCard) continue;

    const amount = Number(txn.debit ?? 0);
    if (!Number.isFinite(amount) || amount <= 0) continue;

    try {
      const plannerResponse = await axios.post(
        `${pythonApiUrl}/api/v1/card-choice`,
        {
          user_id: ctx.userId,
          used_card_id: txn.card_id,
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

      const data = (plannerResponse.data || {}) as CardChoicePlannerPayload;
      const merchant = txn.description || 'Unknown merchant';
      const category = String(data.merchant_category || txn.raw_category || 'other');

      const recommendedCardId = data.recommended_card_id;
      const ownedIncremental = Number(data.owned_card_opportunity?.estimated_incremental_reward ?? data.counterfactual?.estimated_incremental_reward ?? 0);

      if (recommendedCardId && recommendedCardId !== baselineCard.id && Number.isFinite(ownedIncremental) && ownedIncremental > 0) {
        const recommendedCard = cardById.get(recommendedCardId);
        if (recommendedCard) {
          const baselineReward = Number(data.counterfactual?.estimated_reward_baseline ?? 0);
          const recommendedReward = Number(data.counterfactual?.estimated_reward_recommended ?? 0);
          const baselineRatePct = amount > 0 ? Number(((baselineReward / amount) * 100).toFixed(2)) : 0;
          const recommendedRatePct = amount > 0 ? Number(((recommendedReward / amount) * 100).toFixed(2)) : 0;
          const monthlyOwned = Number(data.owned_card_opportunity?.estimated_monthly_incremental_reward ?? 0);
          const annualOwned = Number(data.owned_card_opportunity?.estimated_annual_incremental_reward ?? (monthlyOwned * 12));

          notifications.push(
            buildOwnedCardNotification({
              txn,
              timeframe,
              nowIso: ctx.now.toISOString(),
              txnDateIso: txnDate.toISOString(),
              amount,
              merchant,
              category,
              baselineCardId: baselineCard.id,
              baselineCardLabel: cardLabel(baselineCard),
              recommendedCardId,
              recommendedCardLabel: cardLabel(recommendedCard),
              baselineRatePct,
              recommendedRatePct,
              incrementalReward: ownedIncremental,
              monthlyIncrementalReward: monthlyOwned,
              annualIncrementalReward: annualOwned,
            }),
          );
        }
      }

    } catch (error) {
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        const detail = (error.response?.data as any)?.detail;
        const code = typeof detail?.code === 'string' ? detail.code : '';

        if (status === 422 && code === 'LOW_INCREMENTAL_REWARD') {
          // Skip just this transaction; do not stop evaluating the rest.
          continue;
        }

        if (status === 422 && code === 'NO_REWARD_DATA') {
          const skippedCards = Array.isArray(detail?.skipped_cards)
            ? detail.skipped_cards.map((cardId: unknown) => String(cardId))
            : [];
          const skippedAllCards = skippedCards.length > 0
            && skippedCards.every((cardId: string) => candidateCardIdSet.has(cardId))
            && skippedCards.length >= candidateCardIdSet.size;

          if (skippedAllCards) {
            console.warn('Notifications reward optimization skipped: no reward data for all active cards', {
              userId: ctx.userId,
              skippedCards,
            });
            break;
          }
        }
      }
    }
  }

  // Scenario 2 is intentionally fetched from a dedicated endpoint for easier debugging.
  try {
    const newCardsResponse = await axios.post(
      `${pythonApiUrl}/api/v1/new-card-opportunities`,
      {
        user_id: ctx.userId,
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

    const newCardsData = (newCardsResponse.data || {}) as NewCardOpportunitiesPayload;
    const opportunities = Array.isArray(newCardsData.opportunities)
      ? newCardsData.opportunities
      : [];

    for (const opportunity of opportunities) {
      const suggestedName = (opportunity?.suggested_offer_name || '').trim();
      if (!suggestedName) continue;
      const suggestedOfferId = typeof opportunity?.suggested_offer_id === 'string'
        ? opportunity.suggested_offer_id
        : undefined;

      const monthlyGain = Number(opportunity?.estimated_monthly_incremental_reward ?? 0);
      const annualGain = Number(opportunity?.estimated_annual_incremental_reward ?? (monthlyGain * 12));
      if (!Number.isFinite(monthlyGain) || monthlyGain <= 0) continue;

      const opportunityCategory = String(opportunity?.top_spend_category || 'other');
      const spendSharePct = Number(opportunity?.spend_share_percentage ?? 0);
      const estimatedMonthlySpend = Number(opportunity?.estimated_monthly_spend ?? 0);
      const annualFee = opportunity?.annual_fee ?? null;
      const issuer = opportunity?.suggested_offer_issuer ?? null;

      const uniqueKey = `${ctx.userId}:${opportunityCategory}:${issuer || ''}:${suggestedName}`;
      const candidateNotification = buildNewCardNotification({
        id: `new-card-opportunity:${uniqueKey}`,
        timeframe: 'monthly',
        nowIso: ctx.now.toISOString(),
        eventDateIso: ctx.now.toISOString(),
        amount: estimatedMonthlySpend,
        merchant: 'Multiple merchants',
        category: opportunityCategory,
        baselineCardId: 'portfolio',
        baselineCardLabel: 'Your current cards',
        suggestedOfferId,
        suggestedOfferName: suggestedName,
        suggestedOfferIssuer: issuer,
        monthlyGain,
        annualGain,
        spendSharePct,
        estimatedMonthlySpend,
        annualFee,
        actionUrl: suggestedOfferId
          ? `/cards/offers?focus=${encodeURIComponent(suggestedOfferId)}`
          : `/cards/offers?q=${encodeURIComponent(suggestedName)}`,
      });

      const existing = newCardOpportunityByKey.get(uniqueKey);
      if (!existing || (candidateNotification.incrementalReward > existing.incrementalReward)) {
        newCardOpportunityByKey.set(uniqueKey, candidateNotification);
      }
    }
  } catch (error) {
    if (error instanceof AxiosError) {
      console.warn('Notifications new-card opportunities skipped due to API error', {
        userId: ctx.userId,
        status: error.response?.status,
      });
    }
  }

  notifications.push(...newCardOpportunityByKey.values());

  return notifications;
}

async function getSystemNotifications(_ctx: NotificationProviderContext): Promise<AppNotification[]> {
  // Placeholder provider: add system-level alerts here (maintenance, incidents, outages).
  return [];
}

async function getProfileNotifications(_ctx: NotificationProviderContext): Promise<AppNotification[]> {
  // Placeholder provider: add profile reminders here (missing info, verification tasks).
  return [];
}

async function getActivityNotifications(_ctx: NotificationProviderContext): Promise<AppNotification[]> {
  // Placeholder provider: add user activity alerts here (card linked, sync complete, etc.).
  return [];
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

    const ctx: NotificationProviderContext = {
      userId: user.id,
      now: new Date(),
    };

    const providers: NotificationProvider[] = [
      getRewardOptimizationNotifications,
      getSystemNotifications,
      getProfileNotifications,
      getActivityNotifications,
    ];

    const notifications = await Promise.all(providers.map((provider) => provider(ctx)));
    const summary = mergeNotificationsByTimeframe(notifications.flat());

    return NextResponse.json(createSuccessResponse(summary), { status: 200 });
  } catch (error) {
    console.error('Error loading notifications:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'Failed to load notifications'),
      { status: 500 }
    );
  }
}
