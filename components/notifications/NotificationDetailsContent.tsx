'use client';

import { useEffect, useState } from 'react';

import { Skeleton } from '@/components/ui/Skeleton';
import { formatCurrency } from '@/lib/utils';
import type { RewardNotification } from '@/types/notification.types';

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
  notification: RewardNotification;
  isActive: boolean;
}

export function NotificationDetailsContent({ notification, isActive }: NotificationDetailsContentProps) {
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTransaction = async () => {
      if (!notification || !isActive) return;

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
  }, [notification, isActive]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto pb-3 pr-0.5 overscroll-contain sm:gap-5 [scrollbar-width:thin] [scrollbar-color:#e5e7eb_transparent] dark:[scrollbar-color:#374151_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700">

      {/* Message + meta */}
      <div>
        <p className="text-sm leading-relaxed text-foreground">{notification.message}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="inline-flex rounded-lg bg-muted/70 px-2 py-1 text-[11px] text-muted-foreground">
            {notification.merchant}
          </span>
          <span className="inline-flex rounded-lg bg-muted/70 px-2 py-1 text-[11px] text-muted-foreground">
            {notification.category.toUpperCase()}
          </span>
        </div>
      </div>

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

      {/* Transaction details */}
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

      {/* Subtle disclaimer */}
      <p className="text-[10px] leading-relaxed text-muted-foreground/50">
        Estimates are based on publicly available card benefit data and may not reflect your actual rewards. Verify with your card issuer.
      </p>
    </div>
  );
}
