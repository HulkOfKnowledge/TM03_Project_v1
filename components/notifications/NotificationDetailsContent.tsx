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
    <div className="max-h-[min(66vh,34rem)] space-y-6 overflow-y-auto pr-1 overscroll-contain [scrollbar-width:thin] [scrollbar-color:#e5e7eb_transparent] dark:[scrollbar-color:#374151_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb:hover]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 dark:[&::-webkit-scrollbar-thumb:hover]:bg-gray-600">
      <div className="space-y-2">
        <p className="text-sm leading-7 text-foreground">{notification.message}</p>
        <p className="text-xs text-muted-foreground">
          {notification.merchant} • {notification.category.toUpperCase()}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Amount</p>
          <p className="mt-1 font-medium text-foreground">{formatCurrency(notification.amount)}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Potential reward</p>
          <p className="mt-1 font-medium text-brand">+{formatCurrency(notification.incrementalReward)}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Recommended card</p>
          <p className="mt-1 font-medium text-foreground">{notification.recommendedCardLabel}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Current baseline</p>
          <p className="mt-1 font-medium text-foreground">{notification.baselineCardLabel}</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Transaction details</p>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-3 pt-1">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="px-1 py-1">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="mt-2 h-4 w-11/12" />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : !transaction ? (
          <p className="text-sm text-muted-foreground">Transaction details unavailable.</p>
        ) : (
          <div className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
            <div className="min-w-0 px-1 py-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Description</p>
              <p className="mt-1.5 min-w-0 break-words text-foreground">{transaction.description}</p>
            </div>

            <div className="min-w-0 px-1 py-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Date</p>
              <p className="mt-1.5 min-w-0 break-words text-foreground">
                {new Date(transaction.date).toLocaleString('en-CA', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <div className="min-w-0 px-1 py-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Card</p>
              <p className="mt-1.5 min-w-0 break-words text-foreground">{transaction.cardLabel}</p>
            </div>

            <div className="min-w-0 px-1 py-1">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Balance</p>
              <p className="mt-1.5 min-w-0 break-words text-foreground">
                {transaction.balance == null ? 'Balance not available' : formatCurrency(transaction.balance)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}