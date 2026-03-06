/**
 * CardOverviewSection
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
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
  X,
} from 'lucide-react';
import type { ConnectedCard } from '@/types/card.types';
import { getCardGradientIndex } from '@/lib/utils';
import { CreditCardDisplay } from '@/components/cards/CreditCardDisplay';
import { useUser } from '@/hooks/useAuth';

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

function getCardsNeedingAttention(cards: ConnectedCard[]) {
  return cards
    .filter((c) => safeUtilization(c.utilizationPercentage) > 30)
    .map((c) => ({
      id: c.id,
      bank: c.bank,
      lastFour: c.lastFour,
      utilization: safeUtilization(c.utilizationPercentage),
    }));
}

// Carousel Dots

interface CarouselDotsProps {
  count: number;
  activeIndex: number;
  onSelect: (index: number) => void;
  variant?: 'default' | 'danger';
}

function CarouselDots({ count, activeIndex, onSelect, variant = 'default' }: CarouselDotsProps) {
  if (count <= 1) return null;

  const activeColor = variant === 'danger' ? 'bg-red-500' : 'bg-brand';
  const inactiveColor = 'bg-gray-300 dark:bg-gray-600';

  return (
    <div className="flex items-center justify-center gap-2 mt-3">
      {Array.from({ length: count }).map((_, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(idx)}
          className={`h-2 rounded-full transition-all duration-300 ${
            idx === activeIndex ? `w-6 ${activeColor}` : `w-2 ${inactiveColor}`
          }`}
          aria-label={`View item ${idx + 1}`}
        />
      ))}
    </div>
  );
}

// Card Needs Attention Alert

interface CardNeedsAttentionAlertProps {
  bank: string;
  lastFour: string;
  utilization: number;
  onClose?: () => void;
}

function CardNeedsAttentionAlert({ bank, lastFour, utilization, onClose }: CardNeedsAttentionAlertProps) {
  return (
    <div className="rounded-2xl bg-white dark:bg-neutral-800 border-2 border-red-500 dark:border-red-500 p-4 sm:p-5 flex items-center gap-4 relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center transition-colors group"
          aria-label="Close alert"
        >
          <X className="h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200" />
        </button>
      )}
      <div className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center">
        <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6 text-red-500" strokeWidth={2} />
      </div>
      <div className={`flex-1 min-w-0 ${onClose ? 'pr-8 sm:pr-10' : ''}`}>
        <p className="text-sm sm:text-base text-gray-900 dark:text-white mb-1">
          Your {bank} card ending with {lastFour} needs urgent attention
        </p>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          {utilization}% credit utilization • Make a payment to improve your credit score
        </p>
      </div>
    </div>
  );
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
          <div className="w-[2px] h-12  bg-gray-700 dark:bg-gray-200" />
        </div>

        {/* Gradient bar scaled: 0-25% safe (green), 26-30% caution (yellow), 30%+ danger (orange-red) */}
        <div
          className="h-4 sm:h-5 w-full rounded-full"
          style={{ background: 'linear-gradient(to right, #22c55e 0%, #84cc16 20%, #eab308 27%, #f97316 30%, #ef4444 40%)' }}
        />
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

      {/* Tile 2 – Credit Limit */}
      <div className="rounded-2xl bg-white dark:bg-neutral-800 border border-gray-100 dark:border-white/10 p-5 flex flex-col justify-between min-h-[160px] sm:min-h-[180px]">
        <div className="flex items-start justify-between">
          <span className="text-xs sm:text-sm text-brand font-medium">Credit Limit</span>
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
          <span className="text-xs sm:text-sm text-brand font-medium">Spent This Cycle</span>
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
          <span className="text-xs sm:text-sm text-brand font-medium">Payment Due</span>
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
          <button className="text-white/70 hover:text-white transition-colors mt-0.5">
            <Info className="h-4 w-4" />
          </button>
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
          <button className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors mt-0.5">
            <Info className="h-4 w-4" />
          </button>
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
          <button className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors mt-0.5">
            <Info className="h-4 w-4" />
          </button>
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
          <button className="text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors mt-0.5">
            <Info className="h-4 w-4" />
          </button>
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
  const [alertIndex, setAlertIndex] = useState(0);

  // For single card, show the individual card view
  if (isSingle) {
    const card = cardList[0];
    const util = safeUtilization(card.utilizationPercentage);
    
    return (
      <>
        <TrustBanner />
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

  // Get cards needing attention (>30% utilization)
  const cardsNeedingAttention = getCardsNeedingAttention(cardList);

  // Auto-advance carousel every 3 seconds
  useEffect(() => {
    if (cardsNeedingAttention.length <= 1) return;
    
    const interval = setInterval(() => {
      setAlertIndex((prev) => (prev + 1) % cardsNeedingAttention.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [cardsNeedingAttention.length]);

  return (
    <>
      <TrustBanner />
      <ConsolidatedTiles
        cardCount={cardList.length}
        totalCreditLimit={totalLimit}
        totalSpent={totalBalance}
        earliestDue={earliestDue}
      />
      
      {/* Cards Needing Attention - Carousel */}
      {cardsNeedingAttention.length > 0 && (
        <div className="mb-6 sm:mb-8">
          <CardNeedsAttentionAlert
            bank={cardsNeedingAttention[alertIndex].bank}
            lastFour={cardsNeedingAttention[alertIndex].lastFour}
            utilization={cardsNeedingAttention[alertIndex].utilization}
          />
          <CarouselDots
            count={cardsNeedingAttention.length}
            activeIndex={alertIndex}
            onSelect={setAlertIndex}
            variant="danger"
          />
        </div>
      )}
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
  const [closedAlerts, setClosedAlerts] = useState<Set<string>>(new Set());
  const prev = useCallback(() => setIndex((i) => (i === 0 ? cardList.length - 1 : i - 1)), [cardList.length]);
  const next = useCallback(() => setIndex((i) => (i === cardList.length - 1 ? 0 : i + 1)), [cardList.length]);

  const card = cardList[index];
  const util = safeUtilization(card.utilizationPercentage);
  const status = getUtilizationStatus(util);

  const handleCloseAlert = () => {
    setClosedAlerts(prev => new Set([...prev, card.id]));
  };

  const isAlertClosed = closedAlerts.has(card.id);

  return (
    <>
      <TrustBanner />

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
      
      {/* Urgent Attention Alert for Individual Card */}
      {status === 'danger' && !isAlertClosed && (
        <div className="mb-6 sm:mb-8">
          <CardNeedsAttentionAlert
            bank={card.bank}
            lastFour={card.lastFour}
            utilization={util}
            onClose={handleCloseAlert}
          />
        </div>
      )}
      
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
          <IndividualView cardList={cards} cardholderName={cardholderName} />
        ) : (
          <ConsolidatedView cardList={cards} cardholderName={cardholderName} />
        )}
      </div>
    </section>
  );
}

export default CardOverviewSection;