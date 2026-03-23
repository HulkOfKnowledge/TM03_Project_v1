'use client';

import { useEffect, useState } from 'react';
import { Tag, Wallet } from 'lucide-react';

import { Modal } from '@/components/ui/Modal';
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

interface NotificationDetailModalProps {
  isOpen: boolean;
  notification: RewardNotification | null;
  onClose: () => void;
}

export function NotificationDetailModal({ isOpen, notification, onClose }: NotificationDetailModalProps) {
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTransaction = async () => {
      if (!notification || !isOpen) return;

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
  }, [notification, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton
      size="lg"
      title={notification?.title || 'Notification details'}
      description={undefined}
    >
      {!notification ? null : (
        <div className="max-h-[min(72vh,32rem)] space-y-4 overflow-y-auto pr-1 overscroll-contain [scrollbar-width:thin] [scrollbar-color:#e5e7eb_transparent] dark:[scrollbar-color:#374151_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb:hover]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 dark:[&::-webkit-scrollbar-thumb:hover]:bg-gray-600">
          <div className="rounded-2xl bg-muted/20 p-3 sm:p-4">
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <div className="rounded-xl bg-background/70 px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Amount</p>
                <p className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Wallet className="h-4 w-4 shrink-0 text-brand" />
                  <span className="min-w-0 break-words">{formatCurrency(notification.amount)}</span>
                </p>
              </div>

              <div className="rounded-xl bg-background/70 px-3 py-2.5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Category</p>
                <p className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Tag className="h-4 w-4 shrink-0 text-brand" />
                  <span className="min-w-0 break-words">{notification.category.toUpperCase()}</span>
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-background/70 px-3 py-3 sm:mt-3.5 sm:px-4">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Message</p>
              <p className="mt-1.5 break-words text-sm leading-relaxed text-foreground">
                {notification.message}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-muted/20 p-3 sm:p-4">
            <p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Transaction details</p>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-x-3 gap-y-3">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="rounded-xl bg-background/70 px-3 py-2.5">
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
                <div className="min-w-0 rounded-xl bg-background/70 px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Description</p>
                  <p className="mt-1.5 min-w-0 break-words text-foreground">{transaction.description}</p>
                </div>

                <div className="min-w-0 rounded-xl bg-background/70 px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Date</p>
                  <p className="mt-1.5 min-w-0 break-words text-foreground">{new Date(transaction.date).toLocaleString('en-CA', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                </div>

                <div className="min-w-0 rounded-xl bg-background/70 px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Card</p>
                  <p className="mt-1.5 min-w-0 break-words text-foreground">{transaction.cardLabel}</p>
                </div>

                <div className="min-w-0 rounded-xl bg-background/70 px-3 py-2.5">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Balance</p>
                  <p className="mt-1.5 min-w-0 break-words text-foreground">{transaction.balance == null ? 'Balance not available' : formatCurrency(transaction.balance)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
