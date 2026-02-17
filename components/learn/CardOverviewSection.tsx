/**
 * CardOverviewSection
 */

'use client';

import { useState, useCallback } from 'react';
import {
  Plus,
  Eye,
  EyeOff,
  BookOpen,
  TrendingUp,
  Bell,
  Info,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import type { ConnectedCard } from '@/types/card.types';

// Props 
interface CardOverviewSectionProps {
  cards: ConnectedCard[];
  onAddCard?: () => void;
}

// Helpers

function formatCurrency(amount: number | null | undefined): string {
  const safe = typeof amount === 'number' && isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(safe)
    .replace('CA', '');
}

/** Formats ISO/date string → "Month DD" e.g. "March 19" */
function formatPaymentDue(raw: string | null | undefined): string {
  if (!raw) return '—';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-CA', { month: 'long', day: 'numeric' });
}

function safeUtilization(pct: number | null | undefined): number {
  const n = Number(pct);
  return isFinite(n) ? Math.min(Math.max(Math.round(n), 0), 100) : 0;
}

function utilizationDotColor(pct: number): string {
  if (pct <= 30) return '#22c55e';
  if (pct <= 60) return '#f59e0b';
  return '#ef4444';
}

function healthMsg(pct: number): string {
  if (pct <= 30) return 'Your credit health is looking healthy, make sure you repay on time.';
  if (pct <= 60) return 'Your credit utilization is in the caution zone. Try to pay down balances.';
  return 'Your credit utilization is high. Prioritize paying down your balances.';
}

// Trust Banner

function TrustBanner() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5 sm:px-5 sm:py-3 rounded-2xl border border-brand bg-white dark:bg-neutral-900 mb-6 sm:mb-8">
      <div className="shrink-0 w-8 h-8 rounded-full bg-brand flex items-center justify-center">
        <ShieldCheck className="h-4 w-4 text-white" strokeWidth={2.5} />
      </div>
      <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-snug">
        Your data is encrypted and never shared. We use read-only access so, we can&apos;t move or touch your money.
      </p>
    </div>
  );
}

// Empty State

function EmptyState({ onAddCard }: { onAddCard?: () => void }) {
  return (
    <>
      <TrustBanner />

      <div className="flex flex-col items-center justify-center py-6 px-4">
        {/* Stacked card icon in brand-tinted circle */}
        <div className="w-20 h-20 rounded-full bg-brand/10 dark:bg-brand/20 flex items-center justify-center mb-6 sm:mb-8 relative">
          {/* card */}
          <CreditCard
            className="absolute text-brand"
            strokeWidth={1.5}
          />
        </div>

        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 text-center leading-relaxed mb-6 sm:mb-8 max-w-sm">
          Connect your credit card to unlock personalized insights, track spending, and build your credit score faster.
        </p>

        {/* Connect Your Card */}
        <button
          onClick={onAddCard}
          className="inline-flex items-center gap-2 px-6 py-1 rounded-lg border border-brand text-brand text-sm sm:text-base bg-background hover:bg-brand hover:text-white dark:hover:text-white transition-all duration-200"
        >
          Connect Your Card
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </button>
      </div>
    </>
  );
}

// Utilization Bar

function UtilizationBar({ percent }: { percent: number }) {
  const dotColor = utilizationDotColor(percent);
  const needleLeft = `clamp(0.5%, ${percent}%, 99.5%)`;

  return (
    <div className="space-y-2">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <span className="text-lg sm:text-xl text-gray-900 dark:text-white">
          Credit Utilization
        </span>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: dotColor }} />
          <span className="text-base sm:text-lg text-gray-900 dark:text-white tabular-nums">
            {percent}%
          </span>
        </div>
      </div>

      {/* Needle + bar */}
      <div className="relative pt-4">
        {/* Needle */}
        <div
          className="absolute top-0 z-10 flex flex-col items-center transition-all duration-700"
          style={{ left: needleLeft }}
        >
          <div className="w-1 h-12  bg-gray-700 dark:bg-gray-200" />
        </div>

        {/* Full gradient bar — always green→red, fills entire width */}
        <div
          className="h-4 sm:h-5 w-full rounded-full"
          style={{ background: 'linear-gradient(to right, #22c55e 0%, #84cc16 20%, #eab308 40%, #f97316 65%, #ef4444 100%)' }}
        />
      </div>

      {/* Zone labels */}
      <div className="flex justify-between text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 pt-5 md:pt-0">
        <span>Safe</span>
        <span>Caution</span>
        <span>Danger</span>
      </div>
    </div>
  );
}

// Connected: 4-tile row

interface CardTilesProps {
  card: ConnectedCard;          // the "active" card for tile 1
  creditLimit: number;          // tile 2
  spentThisCycle: number;       // tile 3
  paymentDue: string | null;    // tile 4
}

function CardTiles({ card, creditLimit, spentThisCycle, paymentDue }: CardTilesProps) {
  const [numberVisible, setNumberVisible] = useState(false);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6 sm:mb-8">

      {/* Tile 1*/}
      <div className="rounded-2xl bg-brand p-5 flex flex-col justify-between min-h-[160px] sm:min-h-[180px]">
        <span className="text-xs sm:text-sm text-white/80 font-medium leading-snug">
          {card.bank} {card.name}
        </span>
        <div>
          <p className="text-lg sm:text-xl font-black tracking-widest text-white font-mono leading-tight mt-2">
            {numberVisible
              ? `**** **** ${card.lastFour}`
              : `*** **** ${card.lastFour}`}
          </p>
          <button
            onClick={() => setNumberVisible((v) => !v)}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-colors"
          >
            {numberVisible
              ? <><EyeOff className="h-3.5 w-3.5" /><span>Hide</span></>
              : <><Eye className="h-3.5 w-3.5" /><span>View</span></>}
          </button>
        </div>
      </div>

      {/* Tile 2 – Credit Limit */}
      <div className="rounded-2xl bg-white dark:bg-neutral-800 border border-gray-100 dark:border-white/10 p-5 flex flex-col justify-between min-h-[160px] sm:min-h-[180px]">
        <div className="flex items-start justify-between">
          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">Credit Limit</span>
          <button className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors mt-0.5">
            <Info className="h-4 w-4" />
          </button>
        </div>
        <div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-2 tabular-nums">
            {formatCurrency(creditLimit)}
          </p>
          <button className="mt-3 inline-flex items-center gap-1.5 text-xs bg-brand/15 px-2 py-1 rounded text-brand font-medium transition-opacity">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Learn More</span>
          </button>
        </div>
      </div>

      {/* Tile 3 – Spent This Cycle */}
      <div className="rounded-2xl bg-white dark:bg-neutral-800 border border-gray-100 dark:border-white/10 p-5 flex flex-col justify-between min-h-[160px] sm:min-h-[180px]">
        <div className="flex items-start justify-between">
          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">Spent This Cycle</span>
          <button className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors mt-0.5">
            <Info className="h-4 w-4" />
          </button>
        </div>
        <div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-2 tabular-nums">
            {formatCurrency(spentThisCycle)}
          </p>
          <button className="mt-3 inline-flex items-center gap-1.5 text-xs bg-brand/15 px-2 py-1 rounded text-brand font-medium transition-opacity">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>0.5% Up this week</span>
          </button>
        </div>
      </div>

      {/* Tile 4 – Payment Due */}
      <div className="rounded-2xl bg-white dark:bg-neutral-800 border border-gray-100 dark:border-white/10 p-5 flex flex-col justify-between min-h-[160px] sm:min-h-[180px]">
        <div className="flex items-start justify-between">
          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">Payment Due</span>
          <button className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors mt-0.5">
            <Info className="h-4 w-4" />
          </button>
        </div>
        <div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {formatPaymentDue(paymentDue)}
          </p>
          <button className="mt-3 inline-flex items-center gap-1.5  text-xs bg-brand/15 px-2 py-1 rounded text-brand font-medium transition-opacity">
            <Bell className="h-3.5 w-3.5" />
            <span>Set Reminder</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Consolidated (all cards aggregated)

function ConsolidatedView({ cardList }: { cardList: ConnectedCard[] }) {
  const isSingle = cardList.length === 1;
  const primaryCard = cardList[0];

  // Aggregated values
  const totalLimit   = cardList.reduce((s, c) => s + (c.creditLimit ?? 0), 0);
  const totalBalance = cardList.reduce((s, c) => s + (c.currentBalance ?? 0), 0);

  const util = totalLimit > 0
    ? safeUtilization((totalBalance / totalLimit) * 100)
    : safeUtilization(
        cardList.reduce((s, c) => s + (c.utilizationPercentage ?? 0), 0) / (cardList.length || 1)
      );

  const earliestDue = cardList
    .map((c) => c.paymentDueDate)
    .filter(Boolean)
    .sort()
    .at(0) ?? null;

  return (
    <>
      <TrustBanner />
      <CardTiles
        card={primaryCard}
        creditLimit={isSingle ? primaryCard.creditLimit : totalLimit}
        spentThisCycle={totalBalance}
        paymentDue={earliestDue}
      />
      <UtilizationBar percent={util} />
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10 flex items-start gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 italic">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-gray-400 dark:text-gray-500" />
        <span>{healthMsg(util)}</span>
      </div>
    </>
  );
}

// Individual Card Carousel

function IndividualView({ cardList }: { cardList: ConnectedCard[] }) {
  const [index, setIndex] = useState(0);
  const prev = useCallback(() => setIndex((i) => (i === 0 ? cardList.length - 1 : i - 1)), [cardList.length]);
  const next = useCallback(() => setIndex((i) => (i === cardList.length - 1 ? 0 : i + 1)), [cardList.length]);

  const card = cardList[index];
  const util = safeUtilization(card.utilizationPercentage);

  return (
    <>
      <TrustBanner />

      {/* Dot nav + arrows */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {cardList.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === index
                  ? 'w-6 bg-brand'
                  : 'w-2 bg-gray-300 dark:bg-gray-600'
              }`}
              aria-label={`View card ${i + 1}`}
            />
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={prev}
            className="h-8 w-8 rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            aria-label="Previous card"
          >
            <ChevronLeft className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={next}
            className="h-8 w-8 rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            aria-label="Next card"
          >
            <ChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          </button>
        </div>
      </div>

      <CardTiles
        card={card}
        creditLimit={card.creditLimit}
        spentThisCycle={card.currentBalance}
        paymentDue={card.paymentDueDate}
      />
      <UtilizationBar percent={util} />
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10 flex items-start gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 italic">
        <Info className="h-4 w-4 shrink-0 mt-0.5 text-gray-400 dark:text-gray-500" />
        <span>{healthMsg(util)}</span>
      </div>
    </>
  );
}

// View Mode Toggle

type ViewMode = 'consolidated' | 'individual';

function ViewToggle({ mode, onChange, count }: { mode: ViewMode; onChange: (m: ViewMode) => void; count: number }) {
  return (
    <div className="inline-flex items-center rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-1 gap-1">
      <button
        onClick={() => onChange('consolidated')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          mode === 'consolidated'
            ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
        All ({count})
      </button>
      <button
        onClick={() => onChange('individual')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
          mode === 'individual'
            ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
            : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
        }`}
      >
        <CreditCard className="h-3.5 w-3.5" />
        Individual
      </button>
    </div>
  );
}

// Main Export
export function CardOverviewSection({ cards, onAddCard }: CardOverviewSectionProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('consolidated');
  const hasCards = cards.length > 0;

  return (
    <section className="mb-16">
      <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-white/10 rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5 sm:mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-brand mb-1">
              Card Overview
            </h2>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              See exactly how your credit card is working for you, all in one place.
            </p>
          </div>

          {hasCards && (
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {cards.length > 1 && (
                <ViewToggle mode={viewMode} onChange={setViewMode} count={cards.length} />
              )}
              {/* Add card */}
              <button
                onClick={onAddCard}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-brand text-brand text-sm bg-transparent hover:bg-brand hover:text-white dark:hover:text-white transition-all duration-200 whitespace-nowrap"
              >
                Add card <Plus className="h-4 w-4" strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-300 dark:border-white/10 mb-5 sm:mb-6" />

        {/* Content */}
        {!hasCards ? (
          <EmptyState onAddCard={onAddCard} />
        ) : viewMode === 'individual' && cards.length > 1 ? (
          <IndividualView cardList={cards} />
        ) : (
          <ConsolidatedView cardList={cards} />
        )}
      </div>
    </section>
  );
}

export default CardOverviewSection;