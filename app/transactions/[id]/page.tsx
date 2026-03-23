'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Receipt, Calendar, Wallet, Tag } from 'lucide-react';

import { Navigation } from '@/components/dashboard/Navigation';
import { Footer } from '@/components/landing/Footer';

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

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function TransactionDetailPage() {
  const params = useParams<{ id: string }>();
  const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      if (!params?.id) {
        setError('Transaction ID is missing.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/transactions/${params.id}`, {
          method: 'GET',
          credentials: 'include',
        });

        const payload = await response.json();
        if (!response.ok || !payload.success) {
          throw new Error(payload.error?.message || 'Failed to load transaction');
        }

        setTransaction(payload.data as TransactionDetail);
      } catch (err) {
        console.error(err);
        setError('Unable to load this transaction. It may have been removed or you do not have access.');
      } finally {
        setIsLoading(false);
      }
    };

    run();
  }, [params?.id]);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="pt-28 lg:pt-40 pb-16">
        <div className="container mx-auto px-4 md:px-6 max-w-3xl">
          <div className="mb-6">
            <Link
              href="/notifications"
              className="inline-flex items-center gap-2 text-sm font-medium text-brand hover:text-brand/80"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to notifications
            </Link>
          </div>

          {isLoading ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">Loading transaction...</div>
          ) : error ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">{error}</div>
          ) : !transaction ? (
            <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">Transaction not found.</div>
          ) : (
            <section className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Transaction Details</h1>
                  <p className="mt-1 text-sm text-muted-foreground">{transaction.cardLabel}</p>
                </div>
                <div className={`rounded-xl px-4 py-2 text-sm font-semibold ${transaction.amount >= 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'}`}>
                  ${Math.abs(transaction.amount).toFixed(2)}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Merchant</p>
                  <p className="mt-1 text-sm font-medium text-foreground flex items-center gap-2">
                    <Receipt className="h-4 w-4 text-brand" />
                    {transaction.description}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Date</p>
                  <p className="mt-1 text-sm font-medium text-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-brand" />
                    {formatDate(transaction.date)}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Category</p>
                  <p className="mt-1 text-sm font-medium text-foreground flex items-center gap-2">
                    <Tag className="h-4 w-4 text-brand" />
                    {transaction.category || 'Uncategorized'}
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-background p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Running Balance</p>
                  <p className="mt-1 text-sm font-medium text-foreground flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-brand" />
                    {transaction.balance != null ? `$${transaction.balance.toFixed(2)}` : 'Not available'}
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
