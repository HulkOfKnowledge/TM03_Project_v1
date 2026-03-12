/**
 * Payment Recommendation Modal
 * Answers: "I owe $X across N cards but can only pay $Y  which cards do I pay, how much, and why?"
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { creditIntelligenceService } from '@/services/credit-intelligence.service';
import type { ConnectedCard } from '@/types/card.types';
import type { PaymentRecommendation, PaymentRecommendationResponse } from '@/types/credit-intelligence.types';

interface PaymentRecommendationModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: ConnectedCard[];
}

// Safely format currency
const fmt = (n: number | undefined | null) =>
  n != null && !isNaN(n)
    ? `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '';

// Parse a due-date string into a friendly label and numeric days remaining
function parseDueDate(raw: string | null | undefined): { label: string; daysLeft: number | null } {
  if (!raw) return { label: 'N/A', daysLeft: null };
  try {
    const d = new Date(raw.split('T')[0]);
    if (isNaN(d.getTime())) return { label: raw, daysLeft: null };
    const daysLeft = Math.floor((d.getTime() - Date.now()) / 86_400_000);
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return { label, daysLeft };
  } catch {
    return { label: raw, daysLeft: null };
  }
}

// ─── Compact allocation row (tap to expand reasoning) ────────────────────────

function AllocationRow({
  rec,
  card,
  index,
}: {
  rec: PaymentRecommendation;
  card: ConnectedCard | undefined;
  index: number;
}) {
  const [open, setOpen] = useState(false);

  const suggested = rec.suggestedAmount ?? 0;
  const balance = card?.currentBalance ?? 0;
  const payPct = balance > 0 ? Math.min((suggested / balance) * 100, 100) : 0;
  const cardName = card ? `${card.bank} ••••${card.lastFour}` : rec.cardId;
  const apr = card?.interestRate;
  const { label: dueLabel, daysLeft } = parseDueDate(card?.paymentDueDate);

  const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
  const isOverdue = daysLeft !== null && daysLeft < 0;

  const reasoning =
    typeof rec.reasoning === 'string'
      ? rec.reasoning
      : (rec.reasoning as { en?: string } | null)?.en ?? '';

  const impact = rec.expectedImpact;

  const barColour =
    payPct >= 50 ? 'bg-emerald-500' : payPct >= 25 ? 'bg-amber-500' : 'bg-indigo-500';

  return (
    <div>
      {/* ── Clickable summary row ── */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex w-full items-center gap-3 border-b border-gray-200 px-2 py-3.5 text-left transition-colors bg-white hover:bg-gray-50 active:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 dark:active:bg-gray-800"
      >
        {/* Numbered dot */}
        <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
          {index + 1}
        </span>

        {/* Card name + metadata */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{cardName}</span>
            {isOverdue && (
              <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600 dark:bg-red-900/40 dark:text-red-400">
                Overdue
              </span>
            )}
            {isUrgent && !isOverdue && (
              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                Due in {daysLeft}d
              </span>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1 w-24 flex-shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
              <div
                className={`h-full rounded-full transition-all duration-700 ${barColour}`}
                style={{ width: `${payPct}%` }}
              />
            </div>
            <span className="text-[11px] tabular-nums text-gray-400 dark:text-gray-500">
              {payPct.toFixed(0)}% covered
            </span>
            {apr != null && (
              <span className="hidden text-[11px] text-gray-400 sm:inline dark:text-gray-500">
                · {apr.toFixed(2)}% APR
              </span>
            )}
            {card?.paymentDueDate && !isUrgent && !isOverdue && (
              <span className="hidden text-[11px] text-gray-400 sm:inline dark:text-gray-500">· Due {dueLabel}</span>
            )}
          </div>
        </div>

        {/* Amount + chevron */}
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
            {fmt(suggested)}
          </span>
          <svg
            className={`h-4 w-4 flex-shrink-0 text-gray-300 transition-transform duration-200 dark:text-gray-600 ${open ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* ── Expanded detail (smooth slide) ── */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <div className="border-t border-gray-100 bg-gray-50/70 px-4 pb-4 pt-3.5 dark:border-gray-700/60 dark:bg-gray-800/50">
            {reasoning && (
              <p className="text-[13px] leading-relaxed text-gray-600 dark:text-gray-300">{reasoning}</p>
            )}
            {impact && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(impact.interestSaved ?? 0) > 0 && (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:ring-emerald-800/60">
                    {fmt(impact.interestSaved)} saved/yr
                  </span>
                )}
                {(impact.utilizationImprovement ?? 0) > 0 && (
                  <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700 ring-1 ring-inset ring-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:ring-sky-800/60">
                    −{(impact.utilizationImprovement ?? 0).toFixed(1)}% utilization
                  </span>
                )}
                {(impact.scoreImpactEstimate ?? 0) > 0 && (
                  <span className="rounded-full bg-violet-50 px-2.5 py-1 text-[11px] font-medium text-violet-700 ring-1 ring-inset ring-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:ring-violet-800/60">
                    +{(impact.scoreImpactEstimate ?? 0).toFixed(0)} pts est.
                  </span>
                )}
              </div>
            )}
            {balance > 0 && (
              <div className="mt-3 flex flex-wrap gap-3 border-t border-gray-100/80 pt-3 text-[12px] text-gray-500 dark:border-gray-700/40 dark:text-gray-400">
                <span>
                  Remaining:{' '}
                  <strong className="text-gray-700 dark:text-gray-300">
                    {fmt(Math.max(0, balance - suggested))}
                  </strong>
                </span>
                {(card?.minimumPayment ?? 0) > 0 && (
                  <span>
                    Min:{' '}
                    <strong className="text-gray-700 dark:text-gray-300">
                      {fmt(card!.minimumPayment)}
                    </strong>
                  </span>
                )}
                {apr != null && (
                  <span className="sm:hidden">
                    APR:{' '}
                    <strong className="text-gray-700 dark:text-gray-300">{apr.toFixed(2)}%</strong>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function PaymentRecommendationModal({
  isOpen,
  onClose,
  cards,
}: PaymentRecommendationModalProps) {
  const totalOwed = cards.reduce((s, c) => s + (c.currentBalance ?? 0), 0);

  const [availableAmount, setAvailableAmount] = useState('');
  const [optimizationGoal, setOptimizationGoal] = useState<'balanced' | 'minimize_interest' | 'minimize_balance'>('balanced');
  const [result, setResult] = useState<PaymentRecommendationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'result'>('input');

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setAvailableAmount('');
      setOptimizationGoal('balanced');
      setResult(null);
      setError(null);
      setStep('input');
    }
  }, [isOpen]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const parsedAmount = parseFloat(availableAmount);
  const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;

  const fetchRecommendations = useCallback(async () => {
    if (!isValidAmount) return;
    setLoading(true);
    setError(null);
    try {
      const raw = await creditIntelligenceService.getPaymentRecommendations({
        userId: 'current_user',
        cards: cards.map(card => ({
          cardId: card.id,
          institutionName: card.bank || 'Unknown',
          currentBalance: card.currentBalance,
          creditLimit: card.creditLimit,
          utilizationPercentage: card.utilizationPercentage,
          minimumPayment: card.minimumPayment,
          paymentDueDate: card.paymentDueDate,
          interestRate: card.interestRate ?? 19.99,
          lastPaymentAmount: card.lastPaymentAmount,
          lastPaymentDate: card.lastPaymentDate,
        })),
        availableAmount: parsedAmount,
        optimizationGoal,
      });

      // Service returns the ApiResponse wrapper { success, data, meta }; unwrap it
      const payload =
        (raw as unknown as { data?: PaymentRecommendationResponse }).data ?? raw;
      setResult(payload);
      setStep('result');
    } catch {
      setError('Unable to generate recommendations. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [cards, parsedAmount, isValidAmount, optimizationGoal]);

  if (!isOpen) return null;

  // ── Derived result values ─────────────────────────────────────────────────
  const recs: PaymentRecommendation[] = result?.recommendations ?? [];
  const totalPaid =
    result?.totalAmount ?? recs.reduce((s, r) => s + (r.suggestedAmount ?? 0), 0);
  const savings = result?.projectedSavings;
  const cardById = (id: string) => cards.find(c => c.id === id);

  // Cards with due date ≤ 7 days (used for urgency notice in input step)
  const urgentCount = cards.filter(c => {
    const { daysLeft } = parseDueDate(c.paymentDueDate);
    return daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
  }).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl ring-1 ring-black/5 dark:bg-gray-900 dark:ring-white/[0.08] sm:max-h-[88vh] sm:max-w-lg sm:rounded-3xl">

        {/* ── Header ── */}
        <div className="flex flex-shrink-0 items-start justify-between px-5 pt-5 pb-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-brand">
              Payment Recommendations
            </h2>
            <p className="mt-0.5 text-[13px] text-gray-500 dark:text-gray-400">
              {step === 'input'
                ? `${cards.length} card${cards.length !== 1 ? 's' : ''} · ${fmt(totalOwed)} total balance`
                : `${recs.length} of ${cards.length} card${cards.length !== 1 ? 's' : ''} covered`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:#e5e7eb_transparent] dark:[scrollbar-color:#374151_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb:hover]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 dark:[&::-webkit-scrollbar-thumb:hover]:bg-gray-600">

          {/* ════════ INPUT STEP ════════ */}
          {step === 'input' && (
            <div className="px-5 pb-6 pt-2">

              {/* Balance summary card */}
              <div className="mb-5 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Total balance
                </p>
                <p className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {fmt(totalOwed)}
                </p>
                {urgentCount > 0 && (
                  <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                    ⚠ {urgentCount} card{urgentCount !== 1 ? 's' : ''} due within 7 days
                  </p>
                )}
                {/* Per-card rows */}
                <div className="mt-3 divide-y divide-gray-100 dark:divide-gray-700">
                  {cards.map(card => {
                    const { label, daysLeft } = parseDueDate(card.paymentDueDate);
                    const urgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;
                    return (
                      <div key={card.id} className="flex items-center justify-between py-1.5 text-xs">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {card.bank} ••••{card.lastFour}
                        </span>
                        <div className="flex items-center gap-2 text-right text-gray-500 dark:text-gray-400">
                          <span>{fmt(card.currentBalance)}</span>
                          {card.paymentDueDate && (
                            <span className={urgent ? 'font-semibold text-amber-600 dark:text-amber-400' : ''}>
                              · Due {label}
                            </span>
                          )}
                          {card.interestRate != null && (
                            <span className="text-gray-400 dark:text-gray-500">
                              · {card.interestRate.toFixed(2)}%
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Strategy picker */}
              <div className="mb-5 space-y-1.5">
                <label htmlFor="strategy-select" className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                  Strategy
                </label>
                <div className="relative">
                  <select
                    id="strategy-select"
                    value={optimizationGoal}
                    onChange={e => setOptimizationGoal(e.target.value as typeof optimizationGoal)}
                    className="h-11 w-full appearance-none rounded-2xl border border-gray-200 bg-white pl-4 pr-10 text-sm font-medium text-gray-900 transition-shadow focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="balanced">Balanced: smart mix of APR &amp; urgency</option>
                    <option value="minimize_interest">Highest interest first: Avalanche, save the most</option>
                    <option value="minimize_balance">Lowest balance first: Snowball, quick wins</option>
                  </select>
                  <svg className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Amount input */}
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200">
                  How much can you pay this month?
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-gray-300 dark:text-gray-600">
                    $
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={availableAmount}
                    onChange={e => setAvailableAmount(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    className="h-14 w-full rounded-2xl border border-gray-200 bg-white pl-8 pr-4 text-2xl font-bold tracking-tight text-gray-900 placeholder-gray-200 transition-shadow focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-600 dark:focus:border-indigo-400"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && isValidAmount) fetchRecommendations();
                    }}
                  />
                </div>
                {isValidAmount && parsedAmount < totalOwed && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {fmt(totalOwed - parsedAmount)} will remain after payment  we&apos;ll split
                    your {fmt(parsedAmount)} optimally across all cards.
                  </p>
                )}
                {isValidAmount && parsedAmount >= totalOwed && (
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    You can fully pay off your entire balance.
                  </p>
                )}
              </div>

              {error && (
                <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
                  {error}
                </div>
              )}

              {/* Disclaimer */}
              <p className="mt-5 text-center text-[11px] text-gray-400 dark:text-gray-500">
                For informational use only · Not financial advice · Verify with your card issuer
              </p>
            </div>
          )}

          {/* ════════ RESULT STEP ════════ */}
          {step === 'result' && (
            <div className="pb-4">

              {/* Answer banner */}
              <div className="mx-5 mb-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 px-5 py-4 text-white">
                <p className="text-[11px] font-semibold uppercase tracking-widest opacity-70">
                  Your plan for {fmt(parsedAmount || totalPaid)}
                </p>
                <div className="mt-1.5 flex items-end justify-between gap-3">
                  <div>
                    <p className="text-2xl font-bold">{fmt(totalPaid)}</p>
                    <p className="mt-0.5 text-[13px] opacity-80">
                      across {recs.length} card{recs.length !== 1 ? 's' : ''}
                      {totalOwed - totalPaid > 0
                        ? ` · ${fmt(Math.max(0, totalOwed - totalPaid))} remaining`
                        : ' · fully paid off 🎉'}
                    </p>
                  </div>
                  {savings && (savings.annualInterest ?? 0) > 0 && (
                    <div className="flex-shrink-0 rounded-xl bg-white/10 px-3 py-2 text-right">
                      <p className="text-[10px] uppercase tracking-wide opacity-70">Est. savings</p>
                      <p className="text-sm font-bold">{fmt(savings.annualInterest)}/yr</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Allocation list */}
              {recs.length > 0 ? (
                <div className="mx-5 overflow-hidden rounded-2xl border border-gray-100 dark:border-gray-700">
                  {recs.map((rec, i) => (
                    <div
                      key={rec.cardId}
                      className={i > 0 ? 'border-t border-gray-100 dark:border-gray-700' : ''}
                    >
                      <AllocationRow rec={rec} card={cardById(rec.cardId)} index={i} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mx-5 rounded-2xl bg-gray-50 px-4 py-4 text-sm text-gray-500 dark:bg-gray-800/60 dark:text-gray-400">
                  No allocation was returned. Please try again.
                </p>
              )}

              <p className="mt-3 px-5 pb-2 text-center text-[11px] text-gray-400 dark:text-gray-500">
                Tap any card for details · For informational use only · Not financial advice
              </p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div className="flex flex-shrink-0 gap-2.5 border-t border-gray-100 px-5 py-4 dark:border-gray-700">
          {step === 'result' ? (
            <>
              <button
                onClick={() => {
                  setStep('input');
                  setResult(null);
                  setError(null);
                }}
                className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Adjust amount
              </button>
              <button
                onClick={onClose}
                className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 dark:hover:bg-indigo-500"
              >
                Done
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={fetchRecommendations}
                disabled={!isValidAmount || loading}
                className="flex flex-[2] items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-indigo-500"
              >
                {loading ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    Calculating…
                  </>
                ) : (
                  'Get My Plan'
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
