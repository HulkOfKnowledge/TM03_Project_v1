/**
 * Flinks API → Database transformation functions.
 *
 * These pure mappers convert data from the Flinks /GetAccountsDetail endpoint
 * into the rows expected by credit_data_cache and card_transactions.
 */

import type { FlinksAccountDetail, FlinksTransactionDetail } from '@/types/flinks.types';
import type { CreateCreditDataInput, CreateCardTransactionInput } from '@/types/database.types';
import { inferTransactionCategory } from '@/lib/transactions/category-utils';

/**
 * Derive a credit_data_cache row from a Flinks account snapshot.
 *
 * Transactions are stripped from raw_flinks_data (they are stored separately in
 * card_transactions), keeping the JSONB column lean while preserving all
 * account-level fields for future reference.
 */
export function mapFlinksAccountToCreditData(
  cardId: string,
  account: FlinksAccountDetail,
  extra: {
    /** ISO string for payment_due_date – derived from billing cycle, not in Flinks response */
    dueDate?: string;
    /** APR – not always present in Flinks response; pass from extended bank data */
    interestRate?: number;
    /** Override synced_at for historical back-fill (defaults to NOW() in DB) */
    syncedAt?: string;
  } = {}
): CreateCreditDataInput & { synced_at?: string } {
  // Store account metadata without transactions to keep JSONB lean
  const { Transactions: _transactions, ...rawSnapshot } = account;

  const { Current: balance, Limit: limit, Available: available } = account.Balance;
  const utilizationPct =
    limit > 0 ? parseFloat(((balance / limit) * 100).toFixed(2)) : 0;

  // Canadian minimum payment rule: greater of $10 or 2% of the statement balance
  const minimumPayment = Math.max(10, parseFloat((balance * 0.02).toFixed(2)));

  // Most recent payment within this snapshot's transaction window
  const lastPayment = account.Transactions.filter((t) => (t.Credit ?? 0) > 0).sort(
    (a, b) => new Date(b.Date).getTime() - new Date(a.Date).getTime()
  )[0];

  return {
    card_id: cardId,
    current_balance: balance,
    credit_limit: limit,
    available_credit: available,
    utilization_percentage: utilizationPct,
    minimum_payment: minimumPayment,
    payment_due_date: extra.dueDate,
    last_payment_amount: lastPayment?.Credit ?? undefined,
    last_payment_date: lastPayment ? new Date(lastPayment.Date).toISOString() : undefined,
    interest_rate: extra.interestRate,
    raw_flinks_data: rawSnapshot as Record<string, unknown>,
    ...(extra.syncedAt && { synced_at: extra.syncedAt }),
  };
}

/**
 * Map a Flinks transactions array to card_transactions insert rows.
 *
 * Deduplication is handled at the DB level via UNIQUE(card_id, flinks_transaction_id),
 * so inserting with ON CONFLICT DO NOTHING is safe for incremental syncs.
 */
export function mapFlinksTransactions(
  cardId: string,
  transactions: FlinksTransactionDetail[],
  syncedAt?: string
): CreateCardTransactionInput[] {
  return transactions.map((t) => ({
    // Persist inferred category so both Next.js and Python intelligence read the same taxonomy.
    card_id: cardId,
    flinks_transaction_id: t.Id,
    date: t.Date,
    description: t.Description,
    debit: t.Debit ?? null,
    credit: t.Credit ?? null,
    balance: t.Balance ?? null,
    raw_category: inferTransactionCategory(null, t.Description ?? ''),
    ...(syncedAt && { synced_at: syncedAt }),
  }));
}
