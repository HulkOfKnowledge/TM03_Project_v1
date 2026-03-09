/**
 * API Route: GET /api/cards/metrics
 *
 * Single source of truth for all date-filtered card metrics.
 * Computes balance, utilization, spending, and daily chart series
 * directly from card_transactions — no frontend math required.
 *
 * Query params:
 *   startDate  YYYY-MM-DD  (required)
 *   endDate    YYYY-MM-DD  (required)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';
import type {
  CardMetricsResponse,
  CardPeriodMetrics,
  PeriodMetricsSummary,
} from '@/types/card.types';

export const dynamic = 'force-dynamic';

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers
// ─────────────────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Cap endDate at today so we never project metrics into the future. */
function effectiveEnd(endDate: string): string {
  const today = todayStr();
  return endDate > today ? today : endDate;
}

function getDatesInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start + 'T12:00:00');
  const last = new Date(end + 'T12:00:00');
  while (cur <= last) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

/** Derive the previous period (same duration, one period back). */
function prevPeriodDates(startDate: string, endDate: string): { start: string; end: string } {
  const s = new Date(startDate + 'T12:00:00');
  const e = new Date(endDate + 'T12:00:00');
  const durationMs = e.getTime() - s.getTime() + 86_400_000; // inclusive
  const prevEnd = new Date(s.getTime() - 86_400_000);
  const prevStart = new Date(prevEnd.getTime() - durationMs + 86_400_000);
  return {
    start: prevStart.toISOString().slice(0, 10),
    end: prevEnd.toISOString().slice(0, 10),
  };
}

interface CardInfo {
  id: string;
  bank: string;
  lastFour: string;
  creditLimit: number;
}

interface TxnRow {
  card_id: string;
  date: string;
  debit: number | null;
  credit: number | null;
  balance: number | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Metric computation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute per-card and aggregate metrics for [rangeStart, effectiveEndDate].
 * txns must be sorted date ASC and contain all records up to effectiveEndDate.
 */
function computeMetrics(
  cards: CardInfo[],
  txns: TxnRow[],
  rangeStart: string,
  effEnd: string,
): { cards: CardPeriodMetrics[]; totals: PeriodMetricsSummary } {
  const cardResults: CardPeriodMetrics[] = cards.map(card => {
    const cardTxns = txns.filter(t => t.card_id === card.id);

    // Ending balance = stored balance of the most recent transaction ≤ effEnd.
    // The balance column is the cumulative running balance after each transaction
    // (date-sorted, so this is the true balance as of effEnd).
    const upToEnd = cardTxns.filter(t => t.date <= effEnd);
    const endingBalance = upToEnd.at(-1)?.balance ?? 0;

    // Spending / payments strictly within the display range
    const inRange = cardTxns.filter(t => t.date >= rangeStart && t.date <= effEnd);
    const totalSpending = inRange.reduce((s, t) => s + (t.debit ?? 0), 0);
    const totalPayments = inRange.reduce((s, t) => s + (t.credit ?? 0), 0);

    const utilizationPct = card.creditLimit > 0
      ? (endingBalance / card.creditLimit) * 100
      : 0;

    return {
      id: card.id,
      bank: card.bank,
      lastFour: card.lastFour,
      creditLimit: card.creditLimit,
      endingBalance: +endingBalance.toFixed(2),
      utilizationPct: +utilizationPct.toFixed(2),
      totalSpending: +totalSpending.toFixed(2),
      totalPayments: +totalPayments.toFixed(2),
    };
  });

  const totalCreditLimit = cardResults.reduce((s, c) => s + c.creditLimit, 0);
  const totalEndingBalance = cardResults.reduce((s, c) => s + c.endingBalance, 0);
  const totalSpending = cardResults.reduce((s, c) => s + c.totalSpending, 0);
  const totalPayments = cardResults.reduce((s, c) => s + c.totalPayments, 0);
  const totalUtilizationPct = totalCreditLimit > 0
    ? (totalEndingBalance / totalCreditLimit) * 100
    : 0;

  return {
    cards: cardResults,
    totals: {
      totalCreditLimit: +totalCreditLimit.toFixed(2),
      totalEndingBalance: +totalEndingBalance.toFixed(2),
      totalUtilizationPct: +totalUtilizationPct.toFixed(2),
      totalSpending: +totalSpending.toFixed(2),
      totalPayments: +totalPayments.toFixed(2),
      totalAvailable: +Math.max(totalCreditLimit - totalEndingBalance, 0).toFixed(2),
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Daily series computation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build daily spending and utilization series for each card and combined.
 * allTxns must contain ALL transactions up to the last date in `dates`,
 * including transactions BEFORE `dates[0]` (needed to seed the starting balance).
 */
function computeDaily(
  cards: CardInfo[],
  allTxns: TxnRow[], // sorted date ASC
  dates: string[],
): CardMetricsResponse['daily'] {
  const today = todayStr();
  const firstDate = dates[0] ?? today;

  // Seed the last-known balance per card from transactions BEFORE the range start
  const lastBalance = new Map<string, number>();
  for (const card of cards) {
    const pre = allTxns.filter(t => t.card_id === card.id && t.date < firstDate);
    lastBalance.set(card.id, pre.at(-1)?.balance ?? 0);
  }

  // Group in-range transactions by date for O(1) lookup
  const byDate = new Map<string, TxnRow[]>();
  for (const txn of allTxns) {
    if (txn.date < firstDate) continue; // already applied as initial balance
    if (!byDate.has(txn.date)) byDate.set(txn.date, []);
    byDate.get(txn.date)!.push(txn);
  }

  const spendingByCard: Record<string, number[]> = {};
  const utilizationByCard: Record<string, (number | null)[]> = {};
  for (const card of cards) {
    spendingByCard[card.id] = [];
    utilizationByCard[card.id] = [];
  }

  for (const date of dates) {
    const isFuture = date > today;
    const dayTxns = byDate.get(date) ?? [];

    for (const card of cards) {
      const cardDayTxns = dayTxns.filter(t => t.card_id === card.id);

      // Advance last known balance using each transaction's stored balance
      if (cardDayTxns.length > 0) {
        const last = cardDayTxns.at(-1)!;
        if (last.balance !== null) lastBalance.set(card.id, last.balance);
      }

      const daySpend = cardDayTxns.reduce((s, t) => s + (t.debit ?? 0), 0);
      spendingByCard[card.id].push(isFuture ? 0 : +daySpend.toFixed(2));

      if (isFuture) {
        utilizationByCard[card.id].push(null);
      } else {
        const bal = lastBalance.get(card.id) ?? 0;
        const util = card.creditLimit > 0
          ? +((bal / card.creditLimit) * 100).toFixed(2)
          : 0;
        utilizationByCard[card.id].push(util);
      }
    }
  }

  const totalLimit = cards.reduce((s, c) => s + c.creditLimit, 0);

  const combinedSpending = dates.map((_, i) =>
    +cards.reduce((s, c) => s + (spendingByCard[c.id]?.[i] ?? 0), 0).toFixed(2)
  );

  const combinedUtilization: (number | null)[] = dates.map((date, i) => {
    if (date > today) return null;
    const totalBal = cards.reduce((s, c) => {
      const util = utilizationByCard[c.id]?.[i] ?? 0;
      return s + (util / 100) * c.creditLimit;
    }, 0);
    return totalLimit > 0 ? +((totalBal / totalLimit) * 100).toFixed(2) : null;
  });

  return {
    dates,
    spending: { byCard: spendingByCard, combined: combinedSpending },
    utilization: { byCard: utilizationByCard, combined: combinedUtilization },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty response helper
// ─────────────────────────────────────────────────────────────────────────────
function emptyTotals(): PeriodMetricsSummary {
  return { totalCreditLimit: 0, totalEndingBalance: 0, totalUtilizationPct: 0, totalSpending: 0, totalPayments: 0, totalAvailable: 0 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Route handler
// ─────────────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        createErrorResponse('UNAUTHORIZED', 'Authentication required'),
        { status: 401 },
      );
    }

    const sp = request.nextUrl.searchParams;
    const startDate = sp.get('startDate');
    const endDate   = sp.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        createErrorResponse('BAD_REQUEST', 'startDate and endDate are required'),
        { status: 400 },
      );
    }

    const effEnd = effectiveEnd(endDate);

    // ── 1. Fetch active cards + their latest credit limit ─────────────────────
    const { data: cardRows, error: cardsError } = await supabase
      .from('connected_credit_cards')
      .select('id, institution_name, card_last_four, credit_data:credit_data_cache(credit_limit)')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (cardsError) {
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to fetch cards'),
        { status: 500 },
      );
    }

    if (!cardRows?.length) {
      const empty: CardMetricsResponse = {
        startDate, endDate, effectiveEndDate: effEnd,
        cards: [], totals: emptyTotals(),
        prevPeriod: { startDate: '', endDate: '', cards: [], totals: emptyTotals() },
        daily: { dates: [], spending: { byCard: {}, combined: [] }, utilization: { byCard: {}, combined: [] } },
      };
      return NextResponse.json(createSuccessResponse(empty), { status: 200 });
    }

    const cards: CardInfo[] = (cardRows as any[]).map(r => ({
      id: r.id,
      bank: r.institution_name as string,
      lastFour: r.card_last_four as string,
      // credit_data returns an array; take the most recent (first returned by SELECT *)
      creditLimit: (Array.isArray(r.credit_data) ? r.credit_data[0]?.credit_limit : r.credit_data?.credit_limit) ?? 0,
    }));

    const cardIds = cards.map(c => c.id);

    // ── 2. Previous-period date bounds ────────────────────────────────────────
    const prev     = prevPeriodDates(startDate, endDate);
    const prevEffEnd = effectiveEnd(prev.end);

    // ── 3. Fetch transactions for current period (ALL history up to effEnd) ───
    // We need all-time history (not just startDate..effEnd) so the daily series
    // can seed the correct starting balance.
    const { data: currentTxns, error: txnError } = await supabase
      .from('card_transactions')
      .select('card_id, date, debit, credit, balance')
      .in('card_id', cardIds)
      .lte('date', effEnd)
      .order('date', { ascending: true })
      .order('id',   { ascending: true });

    if (txnError) {
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to fetch transactions'),
        { status: 500 },
      );
    }

    // ── 4. Fetch transactions for previous period (all history up to prevEffEnd)
    const { data: prevTxns, error: prevTxnError } = await supabase
      .from('card_transactions')
      .select('card_id, date, debit, credit, balance')
      .in('card_id', cardIds)
      .lte('date', prevEffEnd)
      .order('date', { ascending: true })
      .order('id',   { ascending: true });

    if (prevTxnError) {
      return NextResponse.json(
        createErrorResponse('DATABASE_ERROR', 'Failed to fetch prev transactions'),
        { status: 500 },
      );
    }

    const txns     = (currentTxns ?? []) as TxnRow[];
    const prevTxnsArr = (prevTxns  ?? []) as TxnRow[];

    // ── 5. Compute metrics ────────────────────────────────────────────────────
    const current  = computeMetrics(cards, txns,     startDate, effEnd);
    const previous = computeMetrics(cards, prevTxnsArr, prev.start, prevEffEnd);

    // ── 6. Build daily series ─────────────────────────────────────────────────
    const dates = getDatesInRange(startDate, endDate);
    const daily = computeDaily(cards, txns, dates);

    // ── 7. Assemble and return ────────────────────────────────────────────────
    const response: CardMetricsResponse = {
      startDate,
      endDate,
      effectiveEndDate: effEnd,
      ...current,
      prevPeriod: {
        startDate: prev.start,
        endDate:   prev.end,
        ...previous,
      },
      daily,
    };

    return NextResponse.json(createSuccessResponse(response), { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/cards/metrics:', error);
    return NextResponse.json(
      createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred'),
      { status: 500 },
    );
  }
}
