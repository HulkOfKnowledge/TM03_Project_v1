'use client';

import { useEffect, useState } from 'react';

import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/utils';
import type { AppNotification } from '@/types/notification.types';

interface TransactionDetail {
  id: string;
  cardId: string;
  date: string;
  description: string;
  amount: number;
  balance: number | null;
  category: string | null;
  cardLabel: string;
  bank: string | null;
  lastFour: string | null;
}

interface NotificationDetailsContentProps {
  notification: AppNotification;
  isActive: boolean;
}

interface CardDangerMetaCard {
  id: string;
  bank: string;
  lastFour: string;
  utilization: number;
}

interface CardDangerMeta {
  source: 'card-utilization';
  threshold?: number;
  cardCount?: number;
  cards?: CardDangerMetaCard[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseCardDangerCards(value: unknown): CardDangerMetaCard[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const parsed = value
    .map((item) => {
      if (!isRecord(item)) return null;
      if (typeof item.id !== 'string') return null;
      if (typeof item.bank !== 'string') return null;
      if (typeof item.lastFour !== 'string') return null;
      if (typeof item.utilization !== 'number' || !Number.isFinite(item.utilization)) return null;

      return {
        id: item.id,
        bank: item.bank,
        lastFour: item.lastFour,
        utilization: item.utilization,
      };
    })
    .filter((item): item is CardDangerMetaCard => item !== null);

  return parsed.length > 0 ? parsed : undefined;
}

function getCardDangerMeta(notification: AppNotification): CardDangerMeta | null {
  if (notification.kind !== 'system') return null;
  const metadata = notification.metadata;
  if (!isRecord(metadata)) return null;
  if (metadata.source !== 'card-utilization') return null;

  return {
    source: 'card-utilization',
    threshold: typeof metadata.threshold === 'number' && Number.isFinite(metadata.threshold)
      ? metadata.threshold
      : undefined,
    cardCount: typeof metadata.cardCount === 'number' && Number.isFinite(metadata.cardCount)
      ? metadata.cardCount
      : undefined,
    cards: parseCardDangerCards(metadata.cards),
  };
}

export function NotificationDetailsContent({ notification, isActive }: NotificationDetailsContentProps) {
  const isRewardNotification = notification.kind === 'reward_optimization';
  const cardDangerMeta = getCardDangerMeta(notification);
  const isCardDangerNotification = Boolean(cardDangerMeta);
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTransaction = async () => {
      if (!notification || !isActive || !isRewardNotification) return;

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/transactions/${notification.transactionId}`, {
          method: 'GET',
          credentials: 'include',
        });

        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error?.message || 'Failed to load transaction details.');
        }

        setTransaction(payload.data as TransactionDetail);
      } catch {
        setTransaction(null);
        setError('Could not load transaction details right now.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTransaction();
  }, [isRewardNotification, notification, isActive]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto pb-3 pr-0.5 overscroll-contain sm:gap-5 [scrollbar-width:thin] [scrollbar-color:#e5e7eb_transparent] dark:[scrollbar-color:#374151_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700">

      {/* Message + meta */}
      <div>
        <p className="text-sm leading-relaxed text-foreground">{notification.message}</p>
        {isRewardNotification && (
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex rounded-lg bg-muted/70 px-2 py-1 text-[11px] text-muted-foreground">
              {notification.merchant}
            </span>
            <span className="inline-flex rounded-lg bg-muted/70 px-2 py-1 text-[11px] text-muted-foreground">
              {notification.category.toUpperCase()}
            </span>
          </div>
        )}
        {isCardDangerNotification && (
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex rounded-lg bg-red-500/10 px-2 py-1 text-[11px] text-red-700 dark:text-red-300">
              Critical
            </span>
            <span className="inline-flex rounded-lg bg-muted/70 px-2 py-1 text-[11px] text-muted-foreground">
              Utilization above {cardDangerMeta?.threshold ?? 30}%
            </span>
          </div>
        )}
      </div>

      {isRewardNotification ? (
        <>
          {/* Estimated reward hero */}
          <div className="flex items-center justify-between gap-3 rounded-2xl py-1">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Estimated reward if used</p>
              <p className="mt-0.5 text-2xl font-bold tracking-tight text-brand">
                ~{formatCurrency(notification.incrementalReward)}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-muted-foreground">Amount Spent</p>
              <p className="mt-0.5 text-lg font-semibold text-foreground">
                {formatCurrency(notification.amount)}
              </p>
            </div>
          </div>

          {/* Card suggestion */}
          <div>
            <p className="mb-3 text-xs font-semibold text-muted-foreground">Card suggestion</p>
            <div className="space-y-2">
              <div className="flex flex-col gap-2 rounded-xl border border-brand/30 bg-brand/5 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 dark:border-brand/20 dark:bg-brand/8">
                <div>
                  <p className="text-[11px] font-medium text-brand">Might earn more rewards</p>
                  <p className="mt-0.5 text-sm font-semibold text-foreground">{notification.recommendedCardLabel}</p>
                </div>
                <span className="w-fit rounded-lg bg-brand/15 px-2.5 py-1 text-[11px] font-semibold text-brand">
                  Suggested
                </span>
              </div>

              <div className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4 dark:bg-muted/10">
                <div>
                  <p className="text-[11px] font-medium text-muted-foreground">Used for this transaction</p>
                  <p className="mt-0.5 text-sm font-medium text-foreground">{notification.baselineCardLabel}</p>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : isCardDangerNotification ? (
        <>
          <div className="flex items-center justify-between gap-3 rounded-2xl py-1">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Cards needing payment attention</p>
              <p className="mt-0.5 text-2xl font-bold tracking-tight text-red-600 dark:text-red-400">
                {cardDangerMeta?.cardCount ?? cardDangerMeta?.cards?.length ?? 0}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs text-muted-foreground">Danger threshold</p>
              <p className="mt-0.5 text-lg font-semibold text-foreground">
                {(cardDangerMeta?.threshold ?? 30).toFixed(0)}%
              </p>
            </div>
          </div>

          {cardDangerMeta?.cards && cardDangerMeta.cards.length > 0 && (
            <div>
              <p className="mb-3 text-xs font-semibold text-muted-foreground">Affected cards</p>
              <div className="space-y-2">
                {cardDangerMeta.cards.slice(0, 4).map((card) => (
                  <div
                    key={card.id}
                    className="flex items-center justify-between rounded-xl border border-red-500/25 bg-red-500/5 px-3 py-2.5"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {card.bank} ••{card.lastFour}
                    </p>
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">{card.utilization}%</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notification Type</p>
          <p className="mt-1 text-sm font-medium text-foreground capitalize">{notification.kind.replace('_', ' ')}</p>
        </div>
      )}

      {/* Transaction details */}
      {isRewardNotification && (
        <div>
          <p className="mb-3 text-xs font-semibold text-muted-foreground">Transaction</p>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-32" />
                </div>
              ))}
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : !transaction ? (
            <p className="text-sm text-muted-foreground">Transaction details unavailable.</p>
          ) : (
            <dl className="divide-y divide-border/50">
              {[
                { label: 'Description', value: transaction.description },
                {
                  label: 'Date',
                  value: new Date(transaction.date).toLocaleString('en-CA', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }),
                },
                { label: 'Card', value: transaction.cardLabel },
                {
                  label: 'Balance',
                  value: transaction.balance == null ? 'Not available' : formatCurrency(transaction.balance),
                },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-1 py-2 sm:py-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <dt className="shrink-0 text-sm text-muted-foreground">{label}</dt>
                  <dd className="text-left text-sm font-medium text-foreground break-words sm:max-w-[65%] sm:text-right">{value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}

      {/* Subtle disclaimer */}
      {isRewardNotification && (
        <p className="text-[10px] leading-relaxed text-muted-foreground/50">
          Estimates are based on publicly available card benefit data and may not reflect your actual rewards. Verify with your card issuer.
        </p>
      )}
    </div>
  );
}
