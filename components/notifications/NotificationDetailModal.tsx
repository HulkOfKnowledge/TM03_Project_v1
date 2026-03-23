'use client';

import { useEffect, useState } from 'react';
import { Calendar, CreditCard, Receipt, Sparkles, Tag, Wallet } from 'lucide-react';

import { Modal } from '@/components/ui/Modal';
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
        <div className="max-h-[min(70vh,32rem)] space-y-4 overflow-y-auto pr-1 overscroll-contain [scrollbar-width:thin] [scrollbar-color:#e5e7eb_transparent] dark:[scrollbar-color:#374151_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb:hover]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 dark:[&::-webkit-scrollbar-thumb:hover]:bg-gray-600">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-background p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Amount</p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-foreground">
                <Wallet className="h-4 w-4 text-brand" />
                {formatCurrency(notification.amount)}
              </p>
            </div>

            <div className="rounded-xl bg-background p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm font-medium text-foreground">
                <Tag className="h-4 w-4 text-brand" />
                {notification.category.toUpperCase()}
              </p>
            </div>

            <div className="rounded-xl bg-background p-3 sm:col-span-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Message</p>
              <p className="mt-1 inline-flex items-start text-sm text-foreground">
                {notification.message}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-background p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Transaction details</p>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading transaction details...</p>
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : !transaction ? (
              <p className="text-sm text-muted-foreground">Transaction details unavailable.</p>
            ) : (
              <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <p className="inline-flex items-center gap-2 text-foreground"><Receipt className="h-4 w-4 text-brand" />{transaction.description}</p>
                <p className="inline-flex items-center gap-2 text-foreground"><Calendar className="h-4 w-4 text-brand" />{new Date(transaction.date).toLocaleString('en-CA', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                <p className="inline-flex items-center gap-2 text-foreground"><CreditCard className="h-4 w-4 text-brand" />{transaction.cardLabel}</p>
                <p className="inline-flex items-center gap-2 text-foreground"><Wallet className="h-4 w-4 text-brand" />{transaction.balance == null ? 'Balance not available' : `Running balance ${formatCurrency(transaction.balance)}`}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
