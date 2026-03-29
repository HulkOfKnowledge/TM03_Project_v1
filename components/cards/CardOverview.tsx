/**
 * Card Overview Dashboard
 * Main view showing card details, metrics, and history
 */

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Info, Search, X } from 'lucide-react';
import type { ConnectedCard, CardOverviewData, Transaction, DateFilter, CardPeriodMetrics } from '@/types/card.types';
import { cardService } from '@/services/card.service';
import { fetchCardMetrics } from '@/lib/api/cards-client';
import { CreditCardDisplay } from './CreditCardDisplay';
import { DailyTransactionTable } from './DailyTransactionTable';
import { VolumeProgressBar } from './VolumeProgressBar';
import { CardOverviewSkeleton } from './CardOverviewSkeleton';
import { DateFilterControls } from './DateFilterControls';
import { MetricCard } from './analysis/MetricCard';
import { PaymentRecommendationModal } from './PaymentRecommendationModal';
import { useUser } from '@/hooks/useAuth';
import { getCardGradientIndex } from '@/lib/utils';
import { inferTransactionCategory, formatCategoryLabel, UNCATEGORIZED_CATEGORY } from '@/lib/transactions/category-utils';

const SWIPE_THRESHOLD = 50;

interface CardOverviewProps {
  card: ConnectedCard;
  onAddCard: () => void;
  onDisconnectCard?: (cardId: string) => void;
  allCards?: ConnectedCard[];
}

export function CardOverview({ card, onAddCard, onDisconnectCard, allCards = [] }: CardOverviewProps) {
  const { profile } = useUser();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [transitionPhase, setTransitionPhase] = useState<'idle' | 'exit' | 'enter'>('idle');
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [showPaymentRec, setShowPaymentRec] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Track which cards have had their data loaded
  const loadedCardIds = useRef(new Set<string>());
  const loadedTransactionIds = useRef(new Set<string>());
  
  // Date filtering state - default to range (first of month to today)
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
  
  const [filterType, setFilterType] = useState<'month' | 'range' | 'year'>('range');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState<string>(firstOfMonth);
  const [endDate, setEndDate] = useState<string>(today);
  
  // Transaction data storage - Map<cardId, Transaction[]>
  const [allTransactionData, setAllTransactionData] = useState<Map<string, Transaction[]>>(new Map());
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  
  // History table filters
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'payments' | 'expenses'>('all');
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState<string>('');
  
  // Touch/swipe state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  const isTransitioning = transitionPhase !== 'idle';

  // Use allCards if provided, otherwise just use the single card
  const cards = allCards.length > 0 ? allCards : [card];
  const currentCard = cards[currentCardIndex];

  // Get user's display name for card
  const cardholderName = profile?.first_name && profile?.surname
    ? `${profile.first_name} ${profile.surname}`
    : profile?.first_name || 'Cardholder';

  // Store data for all cards - Map<cardId, CardOverviewData>
  const [allCardData, setAllCardData] = useState<Map<string, CardOverviewData>>(new Map());

  // Current card's data
  const overviewData = currentCard ? allCardData.get(currentCard.id) : null;
  const currentTransactions = currentCard ? allTransactionData.get(currentCard.id) || [] : [];

  // Adjust currentCardIndex if it becomes out of bounds when cards are removed
  useEffect(() => {
    if (currentCardIndex >= cards.length && cards.length > 0) {
      setCurrentCardIndex(cards.length - 1);
    }
  }, [cards.length, currentCardIndex]);

  // Pre-fetch data for ALL cards on mount or when cards are added/removed
  useEffect(() => {
    const loadNewCards = async () => {
      const currentCardIds = new Set(cards.map(c => c.id));
      
      // Remove data for deleted cards
      setAllCardData(prevData => {
        const newMap = new Map(prevData);
        for (const cardId of newMap.keys()) {
          if (!currentCardIds.has(cardId)) {
            newMap.delete(cardId);
            loadedCardIds.current.delete(cardId);
          }
        }
        return newMap;
      });
      
      // Find cards that haven't been loaded yet
      const cardsNeedingData = cards.filter(c => !loadedCardIds.current.has(c.id));
      
      if (cardsNeedingData.length > 0) {
        setIsLoadingData(true);
        
        try {
          // Fetch data for new cards in parallel
          const results = await Promise.all(
            cardsNeedingData.map(async (c) => {
              try {
                const data = await cardService.getCardOverviewData(c);
                loadedCardIds.current.add(c.id);
                return { id: c.id, data };
              } catch (error) {
                console.error(`Error loading data for card ${c.id}:`, error);
                return null;
              }
            })
          );
          
          // Add new data to the map
          setAllCardData(prevData => {
            const newMap = new Map(prevData);
            results.forEach(result => {
              if (result) {
                newMap.set(result.id, result.data);
              }
            });
            return newMap;
          });
        } catch (error) {
          console.error('Error loading cards data:', error);
        } finally {
          setIsLoadingData(false);
        }
      } else {
        // No new cards to load, just ensure loading is false
        setIsLoadingData(false);
      }
    };

    if (cards.length > 0) {
      loadNewCards();
    } else {
      setAllCardData(new Map());
      loadedCardIds.current.clear();
      setIsLoadingData(false);
    }
  }, [cards.map(c => c.id).join(',')]); // Re-run when card IDs change

  // Fetch transactions for cards
  useEffect(() => {
    const loadTransactions = async () => {
      if (!currentCard) return;
      
      // Check if we already loaded transactions for this card
      if (loadedTransactionIds.current.has(currentCard.id)) {
        return;
      }
      
      setIsLoadingTransactions(true);
      try {
        const transactions = await cardService.getCardTransactions(currentCard.id, 500);
        
        // Calculate zones and utilization for each transaction
        const enrichedTransactions = cardService.calculateTransactionZones(transactions, currentCard);
        
        setAllTransactionData(prev => {
          const newMap = new Map(prev);
          newMap.set(currentCard.id, enrichedTransactions);
          return newMap;
        });
        
        loadedTransactionIds.current.add(currentCard.id);
      } catch (error) {
        console.error('Error loading transactions:', error);
      } finally {
        setIsLoadingTransactions(false);
      }
    };
    
    loadTransactions();
  }, [currentCard?.id]);

  // ── Derived date filter 
  const dateFilter = useMemo((): DateFilter => {
    const fmt = (d: string) => {
      const [y, mo, day] = d.split('-').map(Number);
      return new Date(y, mo - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };
    if (filterType === 'month') {
      const [y, m] = selectedMonth.split('-').map(Number);
      const start = new Date(y, m - 1, 1).toISOString().split('T')[0];
      const end   = new Date(y, m, 0).toISOString().split('T')[0];
      return { type: 'month', startDate: start, endDate: end, label: new Date(y, m - 1, 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) };
    }
    if (filterType === 'year') {
      return { type: 'year', startDate: `${selectedYear}-01-01`, endDate: `${selectedYear}-12-31`, label: selectedYear };
    }
    const s = startDate || today, e = endDate || today;
    return { type: 'range', startDate: s, endDate: e, label: `${fmt(s)} to ${fmt(e)}` };
  }, [filterType, selectedMonth, selectedYear, startDate, endDate, today]);

  // Fetch backend metrics for current card + date filter (single source of truth)
  const [cardMetrics, setCardMetrics] = useState<CardPeriodMetrics | null>(null);
  useEffect(() => {
    if (!currentCard) return;
    let active = true;
    fetchCardMetrics(dateFilter.startDate, dateFilter.endDate).then(data => {
      if (!active) return;
      setCardMetrics(data?.cards.find(c => c.id === currentCard.id) ?? null);
    });
    return () => { active = false; };
  }, [currentCard?.id, dateFilter.startDate, dateFilter.endDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Shared DateFilterControls instance reused in sections to avoid duplicated prop wiring.
  const dateFilterControls = (
    <DateFilterControls
      filterType={filterType}
      onFilterTypeChange={setFilterType}
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
      selectedYear={selectedYear}
      onYearChange={setSelectedYear}
      startDate={startDate}
      onStartDateChange={setStartDate}
      endDate={endDate}
      onEndDateChange={setEndDate}
      today={today}
    />
  );

  const dateRangeTransactions = useMemo(() => {
    if (!currentCard || currentTransactions.length === 0) return [];
    return currentTransactions.filter(
      (txn) => txn.date >= dateFilter.startDate && txn.date <= dateFilter.endDate,
    );
  }, [currentCard, currentTransactions, dateFilter]);

  const searchAndTypeFilteredTransactions = useMemo(() => {
    const query = historySearchQuery.trim().toLowerCase();
    return dateRangeTransactions.filter((txn) => {
      const matchesSearch = !query
        || txn.description.toLowerCase().includes(query)
        || txn.date.includes(query)
        || (txn.category || '').toLowerCase().includes(query)
        || (txn.merchantName || '').toLowerCase().includes(query);

      const matchesType = historyTypeFilter === 'all'
        || (historyTypeFilter === 'payments' && txn.amount < 0)
        || (historyTypeFilter === 'expenses' && txn.amount > 0);

      return matchesSearch && matchesType;
    });
  }, [dateRangeTransactions, historySearchQuery, historyTypeFilter]);

  // Filtered transactions 
  const filteredTransactions = useMemo(() => {
    return searchAndTypeFilteredTransactions.filter((txn) => {
      const normalizedCategory = inferTransactionCategory(txn.category, txn.description, txn.merchantName);
      const matchesCategory = !historyCategoryFilter
        || (historyCategoryFilter === UNCATEGORIZED_CATEGORY && normalizedCategory === UNCATEGORIZED_CATEGORY)
        || normalizedCategory === historyCategoryFilter;
      return matchesCategory;
    });
  }, [searchAndTypeFilteredTransactions, historyCategoryFilter]);

  // ── Display metrics
  const displayMetrics = useMemo(() => {
    if (!overviewData || !currentCard) return [];

    const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Use backend-computed metrics as the source of truth; fall back to card snapshot if not yet loaded
    const endingBalance    = cardMetrics?.endingBalance    ?? currentCard.currentBalance;
    const endingUtilization = cardMetrics?.utilizationPct  ?? (currentCard.creditLimit > 0 ? (currentCard.currentBalance / currentCard.creditLimit) * 100 : 0);
    const totalSpending    = cardMetrics?.totalSpending    ?? 0;

    const purchases = filteredTransactions.filter(t => t.amount > 0);
    const payments  = filteredTransactions.filter(t => t.amount < 0);

    // Due date logic:
    // - Current/future period → show the real upcoming due date from the card
    // - Historical period → project due date to the month after the filter’s end month
    const getDueDate = (): { value: string; description: string } => {
      if (!currentCard.paymentDueDate) return { value: 'N/A', description: 'Not available' };

      const [endYear, endMonth] = dateFilter.endDate.split('-').map(Number);
      const now = new Date();
      const currentYear  = now.getFullYear();
      const currentMonth = now.getMonth() + 1;

      const dueDateStr = currentCard.paymentDueDate.split('T')[0];
      const [dy, dm, dd] = dueDateStr.split('-').map(Number);

      const fmtDate = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      if (endYear > currentYear || (endYear === currentYear && endMonth >= currentMonth)) {
        const realDue  = new Date(dy, dm - 1, dd);
        const daysLeft = Math.floor((realDue.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return {
          value: fmtDate(realDue),
          description: daysLeft > 0 ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left` : 'Past due',
        };
      }

      const projMonthIndex = endMonth % 12;
      const projYear = endMonth === 12 ? endYear + 1 : endYear;
      return { value: fmtDate(new Date(projYear, projMonthIndex, dd)), description: 'Past due date' };
    };

    const dueInfo = getDueDate();

    return [
      { label: 'Credit Balance',  value: formatCurrency(endingBalance),   showInfo: true,  description: `${purchases.length} purchases, ${payments.length} payments in period` },
      { label: 'Due Date',        value: dueInfo.value,                   showInfo: false, description: dueInfo.description },
      { label: 'Credit Limit',    value: formatCurrency(currentCard.creditLimit), showInfo: true, description: `Utilization: ${endingUtilization.toFixed(2)}%` },
      { label: 'Total Spending',  value: formatCurrency(totalSpending),   showInfo: true,  description: 'In selected period' },
    ];
  }, [overviewData, currentCard, filteredTransactions, dateFilter, cardMetrics]);
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isHorizontalSwipe = Math.abs(distanceX) > Math.abs(distanceY);

    if (isHorizontalSwipe && Math.abs(distanceX) > SWIPE_THRESHOLD) {
      if (distanceX > 0) {
        handleNextCard();
      } else {
        handlePrevCard();
      }
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  const handlePrevCard = () => {
    if (transitionPhase !== 'idle') return;
    setHasInteracted(true);
    setTransitionPhase('exit');
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev - 1 + cards.length) % cards.length);
      setTransitionPhase('enter');
      setTimeout(() => setTransitionPhase('idle'), 240);
    }, 160);
  };

  const handleNextCard = () => {
    if (transitionPhase !== 'idle') return;
    setHasInteracted(true);
    setTransitionPhase('exit');
    setTimeout(() => {
      setCurrentCardIndex((prev) => (prev + 1) % cards.length);
      setTransitionPhase('enter');
      setTimeout(() => setTransitionPhase('idle'), 240);
    }, 160);
  };

  const handleDisconnect = () => {
    setShowDisconnectConfirm(false);
    if (onDisconnectCard && currentCard) {
      onDisconnectCard(currentCard.id);
      // If we're removing the last card in the list, move to the previous one
      if (currentCardIndex >= cards.length - 1 && currentCardIndex > 0) {
        setCurrentCardIndex(currentCardIndex - 1);
      }
    }
  };

  const availableCategories = useMemo(() => {
    const categoryCounts = new Map<string, number>();

    searchAndTypeFilteredTransactions.forEach((txn) => {
      const normalizedCategory = inferTransactionCategory(txn.category, txn.description, txn.merchantName);
      categoryCounts.set(normalizedCategory, (categoryCounts.get(normalizedCategory) || 0) + 1);
    });

    return Array.from(categoryCounts.entries())
      .map(([value, count]) => ({ value, label: formatCategoryLabel(value), count }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [searchAndTypeFilteredTransactions]);

  // Safety check: if no current card, don't render
  if (!currentCard) {
    return null;
  }

  // Show loading state while data is being fetched
  if (isLoadingData || !overviewData) {
    return <CardOverviewSkeleton />;
  }

  const zoneText = `${overviewData.utilizationZone} Zone`;

  return (
    <div className="mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-bold text-brand mb-3">
            Card Overview
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400">
            Information shown here is based on the card data you connected.
            Always double-check important details with your bank to be sure
            everything is accurate.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start">
          <button
            onClick={() => setShowPaymentRec(true)}
            className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-brand px-4 py-2 font-medium text-white transition-colors hover:bg-brand/90 dark:hover:bg-brand/90"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Payment Recommendation
          </button>
          <button
            onClick={onAddCard}
            className="flex items-center gap-2 whitespace-nowrap rounded-lg border-2 border-indigo-600 px-4 py-2 font-medium text-indigo-600 transition-colors hover:bg-indigo-50 dark:border-indigo-500 dark:text-indigo-500 dark:hover:bg-indigo-950/30"
          >
            <Plus className="h-4 w-4" />
            Add Card
          </button>
        </div>
      </div>

      {/* Description Box */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900 md:p-6">
        <h3 className="mb-3 font-semibold text-gray-900 dark:text-white">
          Description
        </h3>
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="rounded bg-green-500 px-3 py-1 text-xs font-medium text-white">
            0-25% is safe
          </span>
          <span className="rounded bg-orange-500 px-3 py-1 text-xs font-medium text-white">
            26-30% is caution
          </span>
          <span className="rounded bg-red-500 px-3 py-1 text-xs font-medium text-white">
            above 30% is danger!
          </span>
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-semibold text-gray-900 dark:text-white">
              Credit utilization rate
            </span>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              The reason for the scale is because anything above 30% lowers
              points every month as recommended by the Canadian credit system.
            </p>
          </div>
          <div>
            <span className="font-semibold text-gray-900 dark:text-white">
              Note
            </span>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Even if you stay below 30% utilization rate, if there is a sharp
              increase in your utilization rate (within 30%), you are at higher
              risk of losing credit points.
            </p>
          </div>
        </div>
      </div>

      {/* Card Carousel */}
      <div className="mb-8">
        <div className="mx-auto max-w-2xl px-2 md:px-20">

          {/* Card Stack Container */}
          <div
            className="relative pb-4 pt-8 touch-pan-y md:touch-auto"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Third card in stack - always show with circular indexing when 3+ cards */}
            {cards.length >= 3 && (transitionPhase === 'idle' || transitionPhase === 'enter') && (
              <div className={`pointer-events-none absolute left-1/2 top-0 z-0 w-[88%] -translate-x-1/2 ${transitionPhase === 'enter' ? 'card-stack-in-back' : ''}`}>
                <div className="h-32 overflow-hidden rounded-t-2xl opacity-60 shadow-sm">
                  <CreditCardDisplay
                    bank={cards[(currentCardIndex + 2) % cards.length].bank}
                    name={cardholderName}
                    type={cards[(currentCardIndex + 2) % cards.length].type}
                    lastFour={cards[(currentCardIndex + 2) % cards.length].lastFour}
                    gradientIndex={getCardGradientIndex(cards[(currentCardIndex + 2) % cards.length].id)}
                    size="large"
                  />
                </div>
              </div>
            )}

            {/* Second card in stack - always show with circular indexing when 2+ cards */}
            {cards.length >= 2 && (transitionPhase === 'idle' || transitionPhase === 'enter') && (
              <div className={`pointer-events-none absolute left-1/2 top-5 z-10 w-[94%] -translate-x-1/2 ${transitionPhase === 'enter' ? 'card-stack-in-mid' : ''}`}>
                <div className="h-40 overflow-hidden rounded-t-2xl opacity-80 shadow-md">
                  <CreditCardDisplay
                    bank={cards[(currentCardIndex + 1) % cards.length].bank}
                    name={cardholderName}
                    type={cards[(currentCardIndex + 1) % cards.length].type}
                    lastFour={cards[(currentCardIndex + 1) % cards.length].lastFour}
                    gradientIndex={getCardGradientIndex(cards[(currentCardIndex + 1) % cards.length].id)}
                    size="large"
                  />
                </div>
              </div>
            )}

            {/* Front card (current card) */}
            <div className="relative z-20 top-5">
              {/* Left Arrow - outside the fade animation */}
              {cards.length > 1 && (
                <button
                  onClick={handlePrevCard}
                  className="group absolute -left-16 top-1/2 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-lg transition-colors hover:bg-brand hover:border-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-brand dark:hover:border-brand dark:hover:text-white sm:h-12 sm:w-12 md:flex"
                  disabled={isTransitioning}
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600 group-hover:text-white dark:text-gray-400 sm:h-6 sm:w-6" />
                </button>
              )}

              {/* Right Arrow */}
              {cards.length > 1 && (
                <button
                  onClick={handleNextCard}
                  className="group absolute -right-16 top-1/2 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-lg transition-colors hover:bg-brand hover:border-brand hover:text-white disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-brand dark:hover:border-brand dark:hover:text-white sm:h-12 sm:w-12 md:flex"
                  disabled={isTransitioning}
                >
                  <ChevronRight className="h-5 w-5 text-gray-600 group-hover:text-white dark:text-gray-400 sm:h-6 sm:w-6" />
                </button>
              )}

              {/* Card content - shuffle animation */}
              <div className={`relative ${
                transitionPhase === 'exit' ? 'card-shuffle-out' :
                transitionPhase === 'enter' ? 'card-shuffle-in' :
                cards.length > 1 && !hasInteracted ? 'card-swipe-hint' :
                ''
              }`}>
                <CreditCardDisplay
                  bank={currentCard.bank}
                  name={cardholderName}
                  type={currentCard.type}
                  lastFour={currentCard.lastFour}
                  gradientIndex={getCardGradientIndex(currentCard.id)}
                  size="large"
                />

                {/* Disconnect button on card */}
                <button
                  onClick={() => setShowDisconnectConfirm(true)}
                  className="absolute right-1 top-2 z-30 rounded-full bg-white/50 p-2 transition-colors hover:bg-white/20"
                  title="Disconnect card"
                >
                  <X className="h-4 w-4 text-black dark:text-white" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile swipe hint + dot indicators */}
          {cards.length > 1 && (
            <div className="mt-4 flex flex-col items-center gap-2 md:hidden">
              {!hasInteracted && (
                <p className="text-xs text-gray-400 dark:text-gray-600 flex items-center gap-1.5">
                  Swipe to switch cards
                  <span className="hint-arrow-right inline-block">→</span>
                </p>
              )}
              <div className="flex gap-1.5">
                {cards.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentCardIndex
                        ? 'w-4 bg-brand'
                        : 'w-1.5 bg-gray-300 dark:bg-gray-700'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Card Status and Progress */}
          <div className="mt-6 sm:mt-8">
            <div className="mb-4 flex flex-col items-center text-center">
              <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                This card is in the{' '}
                <span
                  className={`inline-block rounded-sm px-2 py-1 text-xs ${
                    zoneText === 'Safe Zone'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                      : zoneText === 'Caution Zone'
                      ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                  }`}
                >
                  {zoneText}
                </span>
              </p>
              <p className={`text-xs ${
                zoneText === 'Danger Zone'
                  ? 'font-medium text-red-600 dark:text-red-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}>
                {zoneText === 'Safe Zone'
                  ? 'Great work! Keep your spending habits consistent to maintain this.'
                  : zoneText === 'Caution Zone'
                  ? 'Getting close! Monitor your spending carefully and avoid new charges.'
                  : 'Make a payment now to bring your balance down and protect your credit score!'}
              </p>
            </div>

            {/* Volume-style Progress Bar */}
            <div className="w-full">
              <VolumeProgressBar percentage={overviewData.utilizationPercentage} />
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="mb-8">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {currentCard.bank} {currentCard.lastFour} Metrics
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
              Current card information
            </p>
          </div>
          
          {/* Date filter is shown in Transaction History header to keep one primary control location */}
        </div>

        {/* Date badge */}
        <div className="mb-3 inline-flex items-center gap-2 rounded-lg bg-indigo-100 px-3 py-1.5 text-sm font-medium text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
          <Info className="h-4 w-4" />
          Data for {dateFilter.label}
        </div>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {displayMetrics.map((metric, index) => (
            <MetricCard
              key={index}
              label={metric.label}
              value={metric.value}
              description={metric.description}
              showInfo={metric.showInfo}
            />
          ))}
        </div>
      </div>

      {/* History Section */}
      <div className="mb-8">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {currentCard.bank} {currentCard.lastFour} Transaction History
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
              Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''} for {dateFilter.label}
            </p>
          </div>
          
          <div className="w-full md:w-auto">
            {dateFilterControls}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={historySearchQuery}
              onChange={(e) => setHistorySearchQuery(e.target.value)}
              placeholder="Search description, merchant, category"
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:placeholder-gray-400"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:flex-1">
            <select
              value={historyTypeFilter}
              onChange={(e) => setHistoryTypeFilter(e.target.value as 'all' | 'payments' | 'expenses')}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:hover:bg-gray-900"
            >
              <option value="all">All Types</option>
              <option value="payments">Credit Card Payments</option>
              <option value="expenses">Expenses</option>
            </select>
            <select
              value={historyCategoryFilter}
              onChange={(e) => setHistoryCategoryFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:hover:bg-gray-900"
            >
              <option value="">All Categories ({searchAndTypeFilteredTransactions.length})</option>
              {availableCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {`${category.label} (${category.count})`}
                </option>
              ))}
            </select>
            
          </div>
        </div>

        {/* Table */}
        {isLoadingTransactions ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : (
          <DailyTransactionTable data={filteredTransactions} card={currentCard} />
        )}

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      {showDisconnectConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-950">
            <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
              Disconnect Card?
            </h3>
            <p className="mb-6 text-gray-600 dark:text-gray-400">
              Are you sure you want to disconnect {currentCard.name} ending in{' '}
              {currentCard.lastFour}? This action will remove all associated
              data from your dashboard.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDisconnectConfirm(false)}
                className="flex-1 rounded-xl border border-gray-300 px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-900"
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnect}
                className="flex-1 rounded-xl bg-red-600 px-6 py-3 font-medium text-white transition-colors hover:bg-red-700"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Recommendation Modal */}
      <PaymentRecommendationModal
        isOpen={showPaymentRec}
        onClose={() => setShowPaymentRec(false)}
        cards={cards}
      />
    </div>
  );
}
