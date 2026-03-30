/**
 * CardOverviewSection
 */

'use client';

import { useState, useCallback, type ReactNode } from 'react';
import {
  Plus,
  BookOpen,
  TrendingUp,
  Bell,
  Info,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import type { ConnectedCard } from '@/types/card.types';
import { getCardGradientIndex } from '@/lib/utils';
import { CreditCardDisplay } from '@/components/cards/CreditCardDisplay';
import { useUser } from '@/hooks/useAuth';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip';

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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .format(safe)
    .replace('CA', '');
}

function formatPaymentDue(raw: string | null | undefined): string {
  if (!raw) return '';
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString('en-CA', { month: 'long', day: 'numeric' });
}

function safeUtilization(pct: number | null | undefined): number {
  const n = Number(pct);
  if (!isFinite(n)) return 0;
  return parseFloat(Math.min(Math.max(n, 0), 100).toFixed(2));
}

function utilizationDotColor(pct: number): string {
  if (pct <= 25) return '#22c55e';
  if (pct <= 30) return '#f59e0b';
  return '#ef4444';
}

function healthMsg(pct: number): string {
  if (pct <= 25) return 'Your credit health is looking healthy, make sure you repay on time.';
  if (pct <= 30) return 'Your credit utilization is in the caution zone. Try to pay down balances.';
  return 'Your credit utilization is high. Prioritize paying down your balances.';
}

function getUtilizationStatus(pct: number): 'safe' | 'caution' | 'danger' {
  if (pct <= 25) return 'safe';
  if (pct <= 30) return 'caution';
  return 'danger';
}

const TOOLTIP_MESSAGES = {
  dataProtection:
    'Your data is encrypted and never shared. We use read-only access so, we can\'t move or touch your money.',
  paymentDue: 'Shows the date your payment is due so you can avoid late fees and protect your credit score.',
  creditLimit: 'This is the maximum amount you can borrow on this card.',
  spentThisCycle: 'Tracks your current spending on this card during the active billing cycle.',
  totalCreditLimit: 'Combined credit limit across all connected cards.',
  totalSpent: 'Total balance used across all connected cards right now.',
  nextPaymentDue: 'The earliest upcoming payment due date across your connected cards.',
  connectedCards: 'Number of cards currently connected to your profile.',
} as const;

interface IconTooltipProps {
  message: string;
  ariaLabel: string;
  icon: ReactNode;
  align?: 'left' | 'center' | 'right';
  buttonClassName?: string;
}

function IconTooltip({
  message,
  ariaLabel,
  icon,
  align = 'center',
  buttonClassName,
}: IconTooltipProps) {
  const [open, setOpen] = useState(false);
  const contentAlign = align === 'left' ? 'start' : align === 'right' ? 'end' : 'center';

  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          aria-label={ariaLabel}
          aria-expanded={open}
          className={buttonClassName}
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align={contentAlign}
        className="w-64 max-w-[80vw] leading-relaxed"
      >
        {message}
      </TooltipContent>
    </Tooltip>
  );
}

// Empty State

function EmptyState({ onAddCard }: { onAddCard?: () => void }) {
  return (
    <>
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
  const clampedPercent = Math.min(Math.max(percent, 0), 100);
  const fillClipRight = `${100 - clampedPercent}%`;

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

      {/* Track fill bar */}
      <div className="pt-2">
        <div className="relative h-3 w-full rounded-full bg-gray-200 dark:bg-neutral-700 overflow-hidden">
          <div
            className="absolute inset-0 rounded-full transition-all duration-700"
            style={{
              background: 'linear-gradient(to right, #22c55e 0%, #84cc16 20%, #eab308 27%, #f97316 30%, #ef4444 40%)',
              clipPath: `inset(0 ${fillClipRight} 0 0)`,
            }}
          />
        </div>
      </div>

      {/* Zone labels */}
      <div className="relative text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 pt-5 md:pt-0">
        <div className="flex justify-between">
          <span className="absolute" style={{ left: '12.5%', transform: 'translateX(-50%)' }}>Safe</span>
          <span className="absolute" style={{ left: '27.5%', transform: 'translateX(-50%)' }}>Caution</span>
          <span className="absolute" style={{ left: '65%', transform: 'translateX(-50%)' }}>Danger</span>
        </div>
      </div>
    </div>
  );
}

// Connected: Individual card view with 4 tiles

interface CardTilesProps {
  card: ConnectedCard;          // the "active" card for tile 1
  creditLimit: number;          // tile 2
  spentThisCycle: number;       // tile 3
  paymentDue: string | null;    // tile 4
  cardholderName: string;       // user's name
}

function CardTiles({ card, creditLimit, spentThisCycle, paymentDue, cardholderName }: CardTilesProps) {
  // Get consistent gradient for this card
  const gradientIndex = getCardGradientIndex(card.id);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-3 mb-6 sm:mb-8">

      {/* Tile 1*/}
      <div className="min-h-[160px] sm:min-h-[180px]">
        <CreditCardDisplay
          bank={card.bank}
          name={cardholderName}
          type={card.type}
          lastFour={card.lastFour}
          gradientIndex={gradientIndex}
          size="medium"
        />
      </div>

      {/* Tile 2 – Payment Due */}
      <div className="rounded-2xl bg-white dark:bg-neutral-800 border border-gray-100 dark:border-white/10 p-5 flex flex-col justify-between min-h-[160px] sm:min-h-[180px]">
        <div className="flex items-start justify-between">
          <span className="text-xs sm:text-sm text-brand font-medium">Payment Due</span>
          <IconTooltip
            message={TOOLTIP_MESSAGES.paymentDue}
            ariaLabel="Payment due info"
            align="right"
            buttonClassName="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors mt-0.5"
            icon={<Info className="h-4 w-4" />}
          />
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

      {/* Tile 3 – Credit Limit */}
      <div className="rounded-2xl bg-white dark:bg-neutral-800 border border-gray-100 dark:border-white/10 p-5 flex flex-col justify-between min-h-[160px] sm:min-h-[180px]">
        <div className="flex items-start justify-between">
          <span className="text-xs sm:text-sm text-brand font-medium">Credit Limit</span>
          <IconTooltip
            message={TOOLTIP_MESSAGES.creditLimit}
            ariaLabel="Credit limit info"
            align="right"
            buttonClassName="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors mt-0.5"
            icon={<Info className="h-4 w-4" />}
          />
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

      {/* Tile 4 – Spent This Cycle */}
      <div className="rounded-2xl bg-white dark:bg-neutral-800 border border-gray-100 dark:border-white/10 p-5 flex flex-col justify-between min-h-[160px] sm:min-h-[180px]">
        <div className="flex items-start justify-between">
          <span className="text-xs sm:text-sm text-brand font-medium">Spent This Cycle</span>
          <IconTooltip
            message={TOOLTIP_MESSAGES.spentThisCycle}
            ariaLabel="Spent this cycle info"
            align="right"
            buttonClassName="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors mt-0.5"
            icon={<Info className="h-4 w-4" />}
          />
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

    </div>
  );
}

// Consolidated: Aggregated data tiles (no specific card shown)

interface ConsolidatedTilesProps {
  cardCount: number;
  totalCreditLimit: number;
  totalSpent: number;
  earliestDue: string | null;
}

function ConsolidatedTiles({ cardCount, totalCreditLimit, totalSpent, earliestDue }: ConsolidatedTilesProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr] gap-3 mb-6 sm:mb-8">

      {/* Tile 1 – Connected Cards Summary */}
      <div className="rounded-2xl bg-brand border border-brand p-5 flex flex-col justify-between min-h-[160px] sm:min-h-[180px]">
        <div className="flex items-start justify-between">
          <span className="text-xs sm:text-sm text-white font-medium">Connected Cards</span>
          <IconTooltip
            message={TOOLTIP_MESSAGES.connectedCards}
            ariaLabel="Connected cards info"
            align="right"
            buttonClassName="text-white/70 hover:text-white transition-colors mt-0.5"
            icon={<Info className="h-4 w-4" />}
          />
        </div>
        <div>
          <p className="text-2xl sm:text-3xl font-bold text-white mt-2 tabular-nums">
            {cardCount} {cardCount === 1 ? 'Card' : 'Cards'}
          </p>
          <div className="mt-3 flex items-center gap-1.5 text-xs bg-white/20 px-2 py-1 rounded text-white font-medium w-fit">
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>All Cards View</span>
          </div>
        </div>
      </div>

      {/* Tile 2 – Total Credit Limit */}
      <div className="rounded-2xl bg-white dark:bg-neutral-800 border border-gray-100 dark:border-white/10 p-5 flex flex-col justify-between min-h-[160px] sm:min-h-[180px]">
        <div className="flex items-start justify-between">
          <span className="text-xs sm:text-sm text-brand font-medium">Total Credit Limit</span>
          <IconTooltip
            message={TOOLTIP_MESSAGES.totalCreditLimit}
            ariaLabel="Total credit limit info"
            align="right"
            buttonClassName="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors mt-0.5"
            icon={<Info className="h-4 w-4" />}
          />
        </div>
        <div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-2 tabular-nums">
            {formatCurrency(totalCreditLimit)}
          </p>
          <button className="mt-3 inline-flex items-center gap-1.5 text-xs bg-brand/15 px-2 py-1 rounded text-brand font-medium transition-opacity">
            <BookOpen className="h-3.5 w-3.5" />
            <span>Learn More</span>
          </button>
        </div>
      </div>

      {/* Tile 3 – Total Spent */}
      <div className="rounded-2xl bg-white dark:bg-neutral-800 border border-gray-100 dark:border-white/10 p-5 flex flex-col justify-between min-h-[160px] sm:min-h-[180px]">
        <div className="flex items-start justify-between">
          <span className="text-xs sm:text-sm text-brand font-medium">Total Spent</span>
          <IconTooltip
            message={TOOLTIP_MESSAGES.totalSpent}
            ariaLabel="Total spent info"
            align="right"
            buttonClassName="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors mt-0.5"
            icon={<Info className="h-4 w-4" />}
          />
        </div>
        <div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-2 tabular-nums">
            {formatCurrency(totalSpent)}
          </p>
          <button className="mt-3 inline-flex items-center gap-1.5 text-xs bg-brand/15 px-2 py-1 rounded text-brand font-medium transition-opacity">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Across all cards</span>
          </button>
        </div>
      </div>

      {/* Tile 4 – Earliest Payment Due */}
      <div className="rounded-2xl bg-white dark:bg-neutral-800 border border-gray-100 dark:border-white/10 p-5 flex flex-col justify-between min-h-[160px] sm:min-h-[180px]">
        <div className="flex items-start justify-between">
          <span className="text-xs sm:text-sm text-brand font-medium">Next Payment Due</span>
          <IconTooltip
            message={TOOLTIP_MESSAGES.nextPaymentDue}
            ariaLabel="Next payment due info"
            align="right"
            buttonClassName="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors mt-0.5"
            icon={<Info className="h-4 w-4" />}
          />
        </div>
        <div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-2">
            {formatPaymentDue(earliestDue)}
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

function ConsolidatedView({ cardList, cardholderName }: { cardList: ConnectedCard[]; cardholderName: string }) {
  const isSingle = cardList.length === 1;

  // For single card, show the individual card view
  if (isSingle) {
    const card = cardList[0];
    const util = safeUtilization(card.utilizationPercentage);
    
    return (
      <>
        <CardTiles
          card={card}
          creditLimit={card.creditLimit}
          spentThisCycle={card.currentBalance}
          paymentDue={card.paymentDueDate}
          cardholderName={cardholderName}
        />
        <UtilizationBar percent={util} />
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10 flex items-start gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 italic">
          <Info className="h-4 w-4 shrink-0 mt-0.5 text-gray-400 dark:text-gray-500" />
          <span>{healthMsg(util)}</span>
        </div>
      </>
    );
  }

  // For multiple cards, show aggregated view without showing a specific card
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
      <ConsolidatedTiles
        cardCount={cardList.length}
        totalCreditLimit={totalLimit}
        totalSpent={totalBalance}
        earliestDue={earliestDue}
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

function IndividualView({ cardList, cardholderName }: { cardList: ConnectedCard[]; cardholderName: string }) {
  const [index, setIndex] = useState(0);
  const prev = useCallback(() => setIndex((i) => (i === 0 ? cardList.length - 1 : i - 1)), [cardList.length]);
  const next = useCallback(() => setIndex((i) => (i === cardList.length - 1 ? 0 : i + 1)), [cardList.length]);

  const card = cardList[index];
  const util = safeUtilization(card.utilizationPercentage);
  const status = getUtilizationStatus(util);

  return (
    <>
      {/* Dot nav + arrows */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {cardList.map((_, i) => {
              const cardUtil = safeUtilization(cardList[i].utilizationPercentage);
              const isDanger = cardUtil > 30;
              return (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === index
                      ? `w-6 ${isDanger ? 'bg-red-500' : 'bg-brand'}`
                      : `w-2 ${isDanger ? 'bg-red-300 dark:bg-red-600' : 'bg-gray-300 dark:bg-gray-600'}`
                  }`}
                  aria-label={`View card ${i + 1}`}
                />
              );
            })}
          </div>
          {status === 'danger' && (
            <div className="flex items-center gap-1 text-xs text-red-500 dark:text-red-400 font-medium">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>High Utilization - Make Payments</span>
            </div>
          )}
          {status === 'caution' && (
            <div className="flex items-center gap-1 text-xs text-amber-500 dark:text-amber-400 font-medium">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Caution Zone - Monitor Spending</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={prev}
            className="h-8 w-8 rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center bg-gray-300 dark:bg-gray-700 hover:bg-brand dark:hover:bg-brand transition-colors group"
            aria-label="Previous card"
          >
            <ChevronLeft className="h-4 w-4 text-gray-700 dark:text-gray-300 group-hover:text-white dark:group-hover:text-white transition-colors" />
          </button>
          <button
            onClick={next}
            className="h-8 w-8 rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center bg-gray-300 dark:bg-gray-700 hover:bg-brand dark:hover:bg-brand transition-colors group"
            aria-label="Next card"
          >
            <ChevronRight className="h-4 w-4 text-gray-700 dark:text-gray-300 group-hover:text-white dark:group-hover:text-white transition-colors" />
          </button>
        </div>
      </div>

      <CardTiles
        card={card}
        creditLimit={card.creditLimit}
        spentThisCycle={card.currentBalance}
        paymentDue={card.paymentDueDate}
        cardholderName={cardholderName}
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
  const { profile } = useUser();
  const [viewMode, setViewMode] = useState<ViewMode>('consolidated');
  const hasCards = cards.length > 0;

  // Get user's display name for card
  const cardholderName = profile?.first_name && profile?.surname
    ? `${profile.first_name} ${profile.surname}`
    : profile?.first_name || 'Cardholder';

  return (
    <TooltipProvider delayDuration={150}>
      <section className="mb-16">
        <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-200 dark:border-white/10 rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5 sm:mb-6">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <h2 className="text-2xl md:text-3xl font-bold text-brand">
                Card Overview
              </h2>
              <IconTooltip
                message={TOOLTIP_MESSAGES.dataProtection}
                ariaLabel="Data protection information"
                align="left"
                buttonClassName="inline-flex h-8 w-8 items-center justify-center rounded-full hover:bg-brand/10 hover:text-brand transition-colors bg-brand text-white"
                icon={<ShieldCheck className="h-5 w-5" strokeWidth={2.5} />}
              />
            </div>
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
          <IndividualView cardList={cards} cardholderName={cardholderName} />
        ) : (
          <ConsolidatedView cardList={cards} cardholderName={cardholderName} />
        )}
        </div>
      </section>
    </TooltipProvider>
  );
}

export default CardOverviewSection;