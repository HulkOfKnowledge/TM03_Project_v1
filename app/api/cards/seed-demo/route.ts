/**
 * API Route: /api/cards/seed-demo
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSuccessResponse, createErrorResponse } from '@/types/api.types';
import { mapFlinksAccountToCreditData, mapFlinksTransactions } from '@/lib/flinks/mappers';
import type { FlinksAccountDetail, FlinksTransactionDetail } from '@/types/flinks.types';

// ─────────────────────────────────────────────────────────────────────────────
// Demo card catalogue
// ─────────────────────────────────────────────────────────────────────────────

interface DemoCardTemplate {
  title: string;
  institutionName: string;
  institutionId: number;
  network: 'visa' | 'mastercard' | 'amex' | 'other';
  interestRate: number;
  limitRange: [number, number];
}

const DEMO_CARDS: DemoCardTemplate[] = [
  { title: 'TD Visa Platinum',       institutionName: 'TD Canada Trust',    institutionId: 1,  network: 'visa',       interestRate: 19.99, limitRange: [5000, 15000] },
  { title: 'RBC Avion World Elite',  institutionName: 'Royal Bank',         institutionId: 2,  network: 'mastercard', interestRate: 19.99, limitRange: [6000, 20000] },
  { title: 'Scotia Gold Amex',       institutionName: 'Scotiabank',         institutionId: 3,  network: 'amex',       interestRate: 19.99, limitRange: [4000, 12000] },
  { title: 'BMO World Elite',        institutionName: 'Bank of Montreal',   institutionId: 4,  network: 'mastercard', interestRate: 19.99, limitRange: [5000, 15000] },
  { title: 'CIBC Dividend Visa',     institutionName: 'CIBC',               institutionId: 5,  network: 'visa',       interestRate: 19.99, limitRange: [3000, 10000] },
  { title: 'Tangerine Money-Back',   institutionName: 'Tangerine',          institutionId: 6,  network: 'mastercard', interestRate: 19.95, limitRange: [2000,  7000] },
  { title: 'Capital One Secured',    institutionName: 'Capital One Canada', institutionId: 7,  network: 'mastercard', interestRate: 22.99, limitRange: [500,   2000] },
  { title: 'Amex Cobalt Card',       institutionName: 'American Express',   institutionId: 8,  network: 'amex',       interestRate: 20.99, limitRange: [5000, 20000] },
  { title: 'PC Financial MC',        institutionName: 'PC Financial',       institutionId: 9,  network: 'mastercard', interestRate: 19.97, limitRange: [2000,  8000] },
  { title: 'Simplii Cash Back Visa', institutionName: 'Simplii Financial',  institutionId: 10, network: 'visa',       interestRate: 19.99, limitRange: [2500,  9000] },
];

// ─────────────────────────────────────────────────────────────────────────────
// Canadian merchant templates (debit = purchase)
// Descriptions match the format banks actually send through the Flinks feed.
// ─────────────────────────────────────────────────────────────────────────────

interface MerchantTemplate {
  descriptionFn: (n: number) => string; // n = seeded nonce 1000-9999
  range: [number, number];
}

const MERCHANT_TEMPLATES: MerchantTemplate[] = [
  // Groceries
  { descriptionFn: (n) => `LOBLAWS #${n % 900 + 100} TORONTO ON`,              range: [28,  140] },
  { descriptionFn: (n) => `REAL CDN SUPERSTORE #${n % 500 + 100} ON`,          range: [35,  155] },
  { descriptionFn: (n) => `METRO INC #${n % 300 + 200} TORONTO ON`,            range: [22,  120] },
  { descriptionFn: (n) => `SOBEYS #${n % 400 + 100} HAMILTON ON`,              range: [18,  105] },
  { descriptionFn: (n) => `WALMART STORE #${n % 600 + 1000} ON CA`,            range: [15,  200] },
  { descriptionFn: (n) => `NO FRILLS #${n % 200 + 100} TORONTO ON`,            range: [12,   80] },
  // Gas
  { descriptionFn: (n) => `PETRO-CANADA ${String(n).padStart(5, '0')} MISS ON`, range: [40,  95] },
  { descriptionFn: (n) => `ESSO STATION ${String(n % 999).padStart(3, '0')} TORONTO ON`, range: [35, 90] },
  { descriptionFn: (n) => `SHELL STATION ${String(n % 999).padStart(5, '0')} ON`, range: [38, 92] },
  // Dining
  { descriptionFn: (n) => `TIM HORTONS #${n % 90000 + 10000}`,                 range: [3,   18] },
  { descriptionFn: (n) => `MCDONALDS #${n % 90000 + 10000} ON CA`,             range: [5,   25] },
  { descriptionFn: (n) => `STARBUCKS #${n % 9000 + 1000} TORONTO ON`,          range: [4,   20] },
  { descriptionFn: (n) => `SUBWAY ${String(n % 90000).padStart(5, '0')} TORONTO ON`, range: [6, 18] },
  { descriptionFn: (n) => `PIZZA PIZZA #${n % 9000 + 1000} ON`,                range: [12,  38] },
  { descriptionFn: (_n) => `UBER EATS CANADA`,                                  range: [15,  55] },
  // Shopping
  { descriptionFn: (_n) => `AMAZON.CA MARKETPLACE`,                             range: [12, 280] },
  { descriptionFn: (n) => `BEST BUY #${n % 200 + 100} TORONTO ON`,             range: [25, 550] },
  { descriptionFn: (n) => `SHOPPERS DRUG MART ${n % 9000 + 1000}`,             range: [8,   65] },
  { descriptionFn: (n) => `DOLLARAMA ${n % 900 + 100} TORONTO ON`,             range: [4,   28] },
  { descriptionFn: (_n) => `INDIGO BOOKS MUSIC TORONTO ON`,                     range: [12,  70] },
  // Bills / subscriptions
  { descriptionFn: (_n) => `NETFLIX.COM`,                                       range: [17,  17] },
  { descriptionFn: (_n) => `SPOTIFY AB`,                                        range: [11,  11] },
  { descriptionFn: (_n) => `AMAZON PRIME CA`,                                   range: [9,    9] },
  { descriptionFn: (_n) => `ROGERS COMMUNICATIONS INC`,                         range: [80, 155] },
  { descriptionFn: (_n) => `BELL CANADA`,                                       range: [75, 145] },
  { descriptionFn: (_n) => `HYDRO ONE NETWORKS INC`,                            range: [55, 160] },
  // Transport
  { descriptionFn: (_n) => `TORONTO TRANSIT COMMISS`,                           range: [3,    4] },
  { descriptionFn: (_n) => `PRESTO TRANSIT CARD`,                               range: [25,  50] },
  { descriptionFn: (_n) => `UBER* TRIP`,                                         range: [8,   45] },
];

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic PRNG helpers (no Math.random() for stable, per-user data)
// ─────────────────────────────────────────────────────────────────────────────

function hashUserId(userId: string): number {
  let h = 5381;
  for (let i = 0; i < userId.length; i++) {
    h = Math.imul((h << 5) + h, 1) ^ userId.charCodeAt(i);
  }
  return Math.abs(h);
}

/** Deterministic float in [0, 1) from a seed integer. */
function seededFloat(seed: number): number {
  const x = Math.sin(seed + 1) * 10_000;
  return x - Math.floor(x);
}

/** Deterministic integer in [min, max] from a seed integer. */
function seededInt(seed: number, min: number, max: number): number {
  return Math.floor(seededFloat(seed) * (max - min + 1)) + min;
}

/** Deterministic float in [min, max] rounded to 2 dp from a seed integer. */
function seededAmount(seed: number, min: number, max: number): number {
  return parseFloat((seededFloat(seed) * (max - min) + min).toFixed(2));
}

// ─────────────────────────────────────────────────────────────────────────────
// Flinks-shaped data generators
// ─────────────────────────────────────────────────────────────────────────────

/** Returns 'YYYY-MM-DD' for the given Date. */
function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Canadian due-date rule: statement closes on billingDay of the month;
 * payment is due 21 days later (minimum required by Canadian law).
 */
function calcDueDate(statementCloseDate: Date): Date {
  const d = new Date(statementCloseDate);
  d.setDate(d.getDate() + 21);
  return d;
}

/**
 * Generate one month's debit (purchase) + credit (payment) transactions,
 * returning the end-of-month running balance.
 */
function generateMonthTransactions(params: {
  cardIndex: number;
  monthIndex: number;   // 0 = current month, 11 = 11 months ago
  userSeed: number;
  year: number;
  month: number;        // 1-based
  startBalance: number;
  creditLimit: number;
  billingDay: number;
  isCurrentMonth: boolean;  // NEW: flag for current month
  currentDay: number;       // NEW: current day of month
}): { transactions: FlinksTransactionDetail[]; endBalance: number } {
  const { cardIndex, monthIndex, userSeed, year, month, startBalance, creditLimit, billingDay, isCurrentMonth, currentDay } = params;
  const baseSeed = userSeed + cardIndex * 100_000 + monthIndex * 1_000;

  const daysInMonth = new Date(year, month, 0).getDate();
  // For current month, only generate transactions up to currentDay
  const maxDay = isCurrentMonth ? currentDay : daysInMonth;
  
  const txnCount = seededInt(baseSeed, 15, 28);
  const rawTxns: FlinksTransactionDetail[] = [];
  let runningBalance = startBalance;

  // Debit transactions (purchases)
  for (let t = 0; t < txnCount; t++) {
    const txnSeed = baseSeed + t * 17;
    const merchantIdx = seededInt(txnSeed, 0, MERCHANT_TEMPLATES.length - 1);
    const merchant = MERCHANT_TEMPLATES[merchantIdx];
    const nonce = seededInt(txnSeed + 1, 1000, 9999);
    const amount = parseFloat(seededAmount(txnSeed + 2, merchant.range[0], merchant.range[1]).toFixed(2));

    // Never exceed credit limit
    const clamped = Math.min(amount, creditLimit - runningBalance);
    if (clamped <= 0) continue;

    // Only generate transactions up to current day for current month
    const dayOfMonth = seededInt(txnSeed + 3, 1, maxDay);
    runningBalance = parseFloat((runningBalance + clamped).toFixed(2));

    rawTxns.push({
      Id: `demo_txn_c${cardIndex}_m${monthIndex}_t${t}`,
      Date: toDateStr(new Date(year, month - 1, dayOfMonth)),
      Description: merchant.descriptionFn(nonce),
      Debit: clamped,
      Credit: null,
      Balance: runningBalance,
      Code: null,
    });
  }

  // Credit transaction (payment) on the billing day
  // Only add payment if billing day hasn't passed yet (or not current month)
  const paymentDay = Math.min(billingDay, daysInMonth);
  const shouldAddPayment = !isCurrentMonth || paymentDay <= currentDay;
  
  if (shouldAddPayment) {
    const paymentFraction = seededAmount(baseSeed + 500, 0.15, 0.85);
    const paymentAmount = Math.max(10, parseFloat((runningBalance * paymentFraction).toFixed(2)));

    runningBalance = parseFloat(Math.max(0, runningBalance - paymentAmount).toFixed(2));

    rawTxns.push({
      Id: `demo_txn_c${cardIndex}_m${monthIndex}_pmt`,
      Date: toDateStr(new Date(year, month - 1, paymentDay)),
      Description: 'PAYMENT - THANK YOU',
      Debit: null,
      Credit: paymentAmount,
      Balance: runningBalance,
      Code: null,
    });
  }

  // Sort ascending by date (Flinks contract)
  rawTxns.sort((a, b) => (a.Date < b.Date ? -1 : 1));

  // Recalculate running balances after sort
  let recalc = startBalance;
  for (const t of rawTxns) {
    recalc = parseFloat((recalc + (t.Debit ?? 0) - (t.Credit ?? 0)).toFixed(2));
    t.Balance = Math.max(0, recalc);
  }

  return { transactions: rawTxns, endBalance: Math.max(0, recalc) };
}

/**
 * Build a FlinksAccountDetail snapshot for a card at a point in time.
 * This is the exact shape Flinks /GetAccountsDetail would return.
 */
function buildFlinksAccountSnapshot(params: {
  cardIndex: number;
  template: DemoCardTemplate;
  lastFour: string;
  transitNumber: string;
  institutionNumber: string;
  accountNumber: string;
  holderName: string;
  transactions: FlinksTransactionDetail[];
  currentBalance: number;
  creditLimit: number;
}): FlinksAccountDetail {
  const { template, lastFour, creditLimit, currentBalance } = params;
  return {
    Id: `demo_acct_${params.cardIndex}_${lastFour}`,
    Title: template.title,
    AccountNumber: params.accountNumber,
    LastFourDigits: lastFour,
    TransitNumber: params.transitNumber,
    InstitutionNumber: params.institutionNumber,
    Balance: {
      Available: parseFloat((creditLimit - currentBalance).toFixed(2)),
      Current: currentBalance,
      Limit: creditLimit,
    },
    Category: 'Operations',
    Type: 'CreditCard',
    Currency: 'CAD',
    Holder: {
      Name: params.holderName,
      Address: { CivicAddress: '123 Demo St', City: 'Toronto', Province: 'ON', PostalCode: 'M5V 2T6', POBox: null, Country: 'CA' },
      Email: 'demo@example.com',
      PhoneNumber: '4161234567',
    },
    Transactions: params.transactions,
    AccountType: 'Personal',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Route handlers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * POST /api/cards/seed-demo
 *
 * Creates demo credit cards with 12 months of Flinks-shaped transaction history.
 * Idempotent — does nothing if demo cards already exist for the user.
 */
export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        createErrorResponse('UNAUTHORIZED', 'Authentication required'),
        { status: 401 }
      );
    }

    // Idempotency check
    const { count } = await supabase
      .from('connected_credit_cards')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .like('flinks_account_id', 'demo_acct_%');

    if ((count ?? 0) > 0) {
      return NextResponse.json(
        createSuccessResponse({ message: 'Demo cards already seeded for this user', cards: [] }),
        { status: 200 }
      );
    }

    const userSeed = hashUserId(user.id);
    const holderName = (user.email ?? 'demo').split('@')[0].replace(/[^a-zA-Z ]/g, ' ').toUpperCase();
    const now = new Date();
    const createdCards: { id: string; name: string; bank: string; type: string; lastFour: string }[] = [];

    for (let cardIndex = 0; cardIndex < DEMO_CARDS.length; cardIndex++) {
      const template = DEMO_CARDS[cardIndex];
      const cardSeed = userSeed + cardIndex * 7_919; // prime spread per card

      const lastFour        = String(seededInt(cardSeed, 1000, 9999));
      const transitNumber   = String(seededInt(cardSeed + 1, 10000, 99999));
      const institutionNum  = String(template.institutionId).padStart(3, '0');
      const accountNumber   = String(seededInt(cardSeed + 2, 1_000_000, 9_999_999));
      const billingDay      = seededInt(cardSeed + 4, 1, 28);
      // Round credit limit to nearest $500 for realism
      const creditLimit     = Math.round(seededInt(cardSeed + 3, template.limitRange[0], template.limitRange[1]) / 500) * 500;

      // Insert card row (inactive until user activates via the selection modal)
      const { data: newCard, error: cardError } = await supabase
        .from('connected_credit_cards')
        .insert({
          user_id: user.id,
          flinks_login_id: `demo_login_${cardIndex}`,
          flinks_account_id: `demo_acct_${cardIndex}_${lastFour}`,
          institution_name: template.institutionName,
          card_type: 'credit',
          card_last_four: lastFour,
          card_network: template.network,
          is_active: false,
          last_synced_at: now.toISOString(),
        })
        .select()
        .single();

      if (cardError || !newCard) {
        console.error(`Error creating card ${cardIndex}:`, cardError);
        continue;
      }

      // Build 12 months oldest→newest so balance evolves forward
      const allTransactions: FlinksTransactionDetail[] = [];
      const creditDataEntries: ReturnType<typeof mapFlinksAccountToCreditData>[] = [];
      let runningBalance = parseFloat((creditLimit * seededAmount(cardSeed + 5, 0.20, 0.55)).toFixed(2));

      for (let m = 11; m >= 0; m--) {
        const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const year = d.getFullYear();
        const month = d.getMonth() + 1; // 1-based
        const isCurrentMonth = m === 0;
        const currentDay = isCurrentMonth ? now.getDate() : 31;

        const { transactions, endBalance } = generateMonthTransactions({
          cardIndex,
          monthIndex: m,
          userSeed,
          year,
          month,
          startBalance: runningBalance,
          creditLimit,
          billingDay,
          isCurrentMonth,
          currentDay,
        });

        allTransactions.push(...transactions);
        runningBalance = endBalance;

        // Statement closes on billingDay; due 21 days later (Canadian law)
        const daysInMonth = new Date(year, month, 0).getDate();
        const statementClose = new Date(year, month - 1, Math.min(billingDay, daysInMonth));
        const dueDate = calcDueDate(statementClose);
        // synced_at = last day of this month (simulates a monthly sync)
        const syncDate = new Date(year, month, 0);

        const snapshot = buildFlinksAccountSnapshot({
          cardIndex,
          template,
          lastFour,
          transitNumber,
          institutionNumber: institutionNum,
          accountNumber,
          holderName,
          transactions,
          currentBalance: endBalance,
          creditLimit,
        });

        creditDataEntries.push(
          mapFlinksAccountToCreditData(newCard.id, snapshot, {
            dueDate: dueDate.toISOString(),
            interestRate: template.interestRate,
            syncedAt: syncDate.toISOString(),
          })
        );
      }

      // Insert 12 monthly credit_data_cache snapshots
      const { error: cacheError } = await supabase
        .from('credit_data_cache')
        .insert(creditDataEntries);
      if (cacheError) console.error(`credit_data_cache insert error card ${cardIndex}:`, cacheError);

      // Insert all individual transactions in chunks of 200
      const txnRows = mapFlinksTransactions(newCard.id, allTransactions, now.toISOString());
      const CHUNK = 200;
      for (let i = 0; i < txnRows.length; i += CHUNK) {
        const { error: txnError } = await supabase
          .from('card_transactions')
          .insert(txnRows.slice(i, i + CHUNK));
        if (txnError) console.error(`card_transactions insert error card ${cardIndex} chunk ${i}:`, txnError);
      }

      createdCards.push({ id: newCard.id, name: template.title, bank: template.institutionName, type: template.network, lastFour });
    }

    return NextResponse.json(
      createSuccessResponse({
        message: `Seeded ${createdCards.length} demo cards with 12 months of Flinks-shaped transaction history`,
        cards: createdCards,
      }),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/cards/seed-demo:', error);
    return NextResponse.json(createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred'), { status: 500 });
  }
}

/**
 * DELETE /api/cards/seed-demo
 * Removes all cards (cascades to credit_data_cache and card_transactions) for the user.
 */
export async function DELETE(_request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(createErrorResponse('UNAUTHORIZED', 'Authentication required'), { status: 401 });
    }

    const { error: deleteError } = await supabase
      .from('connected_credit_cards')
      .delete()
      .eq('user_id', user.id);

    if (deleteError) {
      console.error('Error deleting cards:', deleteError);
      return NextResponse.json(createErrorResponse('DATABASE_ERROR', 'Failed to delete cards'), { status: 500 });
    }

    return NextResponse.json(createSuccessResponse({ message: 'All demo data deleted successfully' }), { status: 200 });
  } catch (error) {
    console.error('Error in DELETE /api/cards/seed-demo:', error);
    return NextResponse.json(createErrorResponse('INTERNAL_ERROR', 'An unexpected error occurred'), { status: 500 });
  }
}
