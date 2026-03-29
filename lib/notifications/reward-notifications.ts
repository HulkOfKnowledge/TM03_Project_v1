import type { RewardNotification, NotificationsSummary, NotificationTimeframe } from '@/types/notification.types';
import { inferTransactionCategory } from '@/lib/transactions/category-utils';

export interface NotificationCard {
  id: string;
  institutionName: string;
  lastFour: string;
}

export interface NotificationTransaction {
  id: string;
  cardId: string;
  date: string;
  description: string;
  amount: number;
  rawCategory: string | null;
}

export interface RewardRateOffer {
  issuer: string;
  earnRateGrocery: number | null;
  earnRateTravel: number | null;
  earnRateDining: number | null;
  earnRateOther: number | null;
}

function offerCategoryRate(offer: RewardRateOffer, category: string): number {
  const raw = category === 'groceries'
    ? Number(offer.earnRateGrocery ?? offer.earnRateOther ?? 0)
    : category === 'travel'
      ? Number(offer.earnRateTravel ?? offer.earnRateOther ?? 0)
      : category === 'dining'
        ? Number(offer.earnRateDining ?? offer.earnRateOther ?? 0)
        : Number(offer.earnRateOther ?? 0);

  if (!Number.isFinite(raw) || raw <= 0) return 0;

  // Normalization rules:
  // - <= 0.2 likely already decimal cashback (e.g., 0.02 = 2%)
  // - <= 10 likely percent-like multiplier in seed data (1,2,3,5 => 1%,2%,...)
  // - > 10 likely points/$ style (e.g., 45 points/$ ~= 4.5% using 1000 pts = $1)
  if (raw <= 0.2) return raw;
  if (raw <= 10) return raw / 100;
  return raw / 1000;
}

function heuristicRate(institutionName: string, category: string): number {
  const institution = institutionName.toLowerCase();
  if (institution.includes('amex') && ['dining', 'groceries', 'travel'].includes(category)) return 0.03;
  if (institution.includes('tangerine')) return 0.02;
  if (institution.includes('scotia') && ['groceries', 'gas', 'bills'].includes(category)) return 0.02;
  return 0.01;
}

function inferRate(card: NotificationCard, category: string, offers: RewardRateOffer[]): number {
  const cardName = card.institutionName.toLowerCase();
  const matchingOffers = offers.filter((offer) => {
    const issuer = (offer.issuer || '').toLowerCase();
    return issuer.includes(cardName) || cardName.includes(issuer);
  });

  if (matchingOffers.length > 0) {
    return matchingOffers.reduce((best, offer) => Math.max(best, offerCategoryRate(offer, category)), 0);
  }

  return heuristicRate(card.institutionName, category);
}

function bucketByTimeframe(date: Date, now: Date): NotificationTimeframe | null {
  const ageMs = now.getTime() - date.getTime();
  if (ageMs < 0) return null;

  const dayMs = 24 * 60 * 60 * 1000;
  if (ageMs <= dayMs) return 'daily';
  if (ageMs <= 7 * dayMs) return 'weekly';
  if (ageMs <= 30 * dayMs) return 'monthly';
  return null;
}

function cardLabel(card: NotificationCard): string {
  return `${card.institutionName} •••• ${card.lastFour}`;
}

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function buildSimpleMessage(params: {
  amount: number;
  category: string;
  baselineCard: NotificationCard;
  bestCard: NotificationCard;
  baselineRatePct: number;
  bestRatePct: number;
  incremental: number;
  transactionId: string;
}): string {
  const {
    amount,
    category,
    baselineCard,
    bestCard,
    baselineRatePct,
    bestRatePct,
    incremental,
    transactionId,
  } = params;

  const amountText = `$${amount.toFixed(2)}`;
  const gainText = `$${incremental.toFixed(2)}`;
  const usedCard = cardLabel(baselineCard);
  const betterCard = cardLabel(bestCard);
  const usedCardPhrase = `the card you used (${usedCard})`;
  const key = `${transactionId}-${category}-${baselineCard.id}-${bestCard.id}`;
  const categoryPhrase = category === 'other' ? 'this type of purchase' : `${category} purchases`;

  const templates = [
    `You could have earned ${gainText} more on this ${amountText} purchase by using your ${betterCard} instead of ${usedCardPhrase}. ${betterCard} gives ${bestRatePct.toFixed(2)}% back on ${categoryPhrase}, while ${usedCardPhrase} gives ${baselineRatePct.toFixed(2)}%.`,
    `For this ${amountText} purchase, your ${betterCard} was the better card. It could have earned about ${gainText} more because it gives ${bestRatePct.toFixed(2)}% back on ${categoryPhrase}, compared with ${baselineRatePct.toFixed(2)}% on ${usedCardPhrase}.`,
    `Better card for this purchase: ${betterCard}. It could have earned around ${gainText} more than ${usedCardPhrase}, because it earns ${bestRatePct.toFixed(2)}% back on ${categoryPhrase} and ${usedCardPhrase} earns ${baselineRatePct.toFixed(2)}%.`,
    `Simple tip: use your ${betterCard} for ${categoryPhrase}. On this ${amountText} purchase, that card could have earned about ${gainText} more than ${usedCardPhrase} (${bestRatePct.toFixed(2)}% back vs ${baselineRatePct.toFixed(2)}%).`,
  ];

  return templates[hashString(key) % templates.length];
}

function buildSimpleTitle(txnDescription: string, transactionId: string): string {
  const templates = [
    `Better rewards card found`,
    `You had a higher rewards option`,
    `Card tip for this purchase`,
    `You could have earned more`,
  ];

  return templates[hashString(`${transactionId}-${txnDescription}`) % templates.length];
}

export function buildRewardNotifications(params: {
  cards: NotificationCard[];
  transactions: NotificationTransaction[];
  offers: RewardRateOffer[];
  now?: Date;
}): NotificationsSummary {
  const { cards, transactions, offers } = params;
  const now = params.now ?? new Date();

  const cardById = new Map(cards.map((card) => [card.id, card]));
  const notifications: RewardNotification[] = [];

  for (const txn of transactions) {
    if (txn.amount <= 0) continue;

    const txnDate = new Date(txn.date);
    if (Number.isNaN(txnDate.getTime())) continue;

    const timeframe = bucketByTimeframe(txnDate, now);
    if (!timeframe) continue;

    const baselineCard = cardById.get(txn.cardId);
    if (!baselineCard) continue;

    const category = inferTransactionCategory(txn.rawCategory, txn.description);
    const baselineRate = inferRate(baselineCard, category, offers);

    let bestCard = baselineCard;
    let bestRate = baselineRate;

    for (const candidate of cards) {
      const candidateRate = inferRate(candidate, category, offers);
      if (candidateRate > bestRate) {
        bestRate = candidateRate;
        bestCard = candidate;
      }
    }

    const incremental = txn.amount * (bestRate - baselineRate);
    if (bestCard.id === baselineCard.id || incremental <= 0.01) continue;

    const item: RewardNotification = {
      id: `${txn.id}-${timeframe}`,
      kind: 'reward_optimization',
      transactionId: txn.id,
      cardId: txn.cardId,
      timeframe,
      createdAt: now.toISOString(),
      eventDate: txnDate.toISOString(),
      merchant: txn.description,
      category,
      amount: Number(txn.amount.toFixed(2)),
      baselineCardId: baselineCard.id,
      baselineCardLabel: cardLabel(baselineCard),
      recommendedCardId: bestCard.id,
      recommendedCardLabel: cardLabel(bestCard),
      baselineRate: Number((baselineRate * 100).toFixed(2)),
      recommendedRate: Number((bestRate * 100).toFixed(2)),
      incrementalReward: Number(incremental.toFixed(2)),
      title: buildSimpleTitle(txn.description, txn.id),
      message: buildSimpleMessage({
        amount: txn.amount,
        category,
        baselineCard,
        bestCard,
        baselineRatePct: Number((baselineRate * 100).toFixed(2)),
        bestRatePct: Number((bestRate * 100).toFixed(2)),
        incremental,
        transactionId: txn.id,
      }),
      actionUrl: `/transactions/${txn.id}`,
      viewTransactionUrl: `/transactions/${txn.id}`,
    };

    notifications.push(item);
  }

  const sortDesc = (a: RewardNotification, b: RewardNotification) =>
    new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();

  notifications.sort(sortDesc);

  return {
    unreadCount: notifications.length,
    notifications,
    byKind: {
      reward_optimization: notifications.length,
      system: 0,
      profile: 0,
      activity: 0,
    },
  };
}
