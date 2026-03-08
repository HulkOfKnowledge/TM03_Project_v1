/**
 * Card Overview Dashboard
 * Main view showing card details, metrics, and history
 */

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Info, Search, X } from 'lucide-react';
import type { ConnectedCard, CardOverviewData, Transaction, DateFilter } from '@/types/card.types';
import { cardService } from '@/services/card.service';
import { CreditCardDisplay } from './CreditCardDisplay';
import { CardHistoryTable } from './CardHistoryTable';
import { DailyTransactionTable } from './DailyTransactionTable';
import { VolumeProgressBar } from './VolumeProgressBar';
import { CardOverviewSkeleton } from './CardOverviewSkeleton';
import { useUser } from '@/hooks/useAuth';
import { getCardGradientIndex } from '@/lib/utils';

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
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Track which cards have had their data loaded
  const loadedCardIds = useRef(new Set<string>());
  const loadedTransactionIds = useRef(new Set<string>());
  
  // Date filtering state
  const [filterType, setFilterType] = useState<'month' | 'range' | 'year'>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  // Transaction data storage - Map<cardId, Transaction[]>
  const [allTransactionData, setAllTransactionData] = useState<Map<string, Transaction[]>>(new Map());
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  
  // History table filters
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyZoneFilter, setHistoryZoneFilter] = useState<string>('');
  const [viewMode, setViewMode] = useState<'monthly' | 'daily'>('daily');
  
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

  // Minimum swipe distance (in pixels)
  const minSwipeDistance = 50;

  // Get current date filter
  const getCurrentDateFilter = (): DateFilter => {
    const now = new Date();
    
    if (filterType === 'month') {
      const [year, month] = selectedMonth.split('-');
      const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endOfMonth = new Date(parseInt(year), parseInt(month), 0);
      
      return {
        type: 'month',
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: endOfMonth.toISOString().split('T')[0],
        label: startOfMonth.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
      };
    } else if (filterType === 'year') {
      return {
        type: 'year',
        startDate: `${selectedYear}-01-01`,
        endDate: `${selectedYear}-12-31`,
        label: selectedYear
      };
    } else {
      // range
      return {
        type: 'range',
        startDate: startDate || now.toISOString().split('T')[0],
        endDate: endDate || now.toISOString().split('T')[0],
        label: `${startDate || 'Start'} to ${endDate || 'End'}`
      };
    }
  };

  // Apply date filter to transactions
  const filteredTransactions = useMemo(() => {
    if (!currentCard || currentTransactions.length === 0) return [];
    
    const dateFilter = getCurrentDateFilter();
    
    return currentTransactions.filter(txn => {
      const txnDate = txn.date;
      const inDateRange = txnDate >= dateFilter.startDate && txnDate <= dateFilter.endDate;
      
      // Search filter
      const matchesSearch = !historySearchQuery || 
        txn.description.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
        txn.date.includes(historySearchQuery);
      
      // Zone filter
      const matchesZone = !historyZoneFilter || txn.zone === historyZoneFilter;
      
      return inDateRange && matchesSearch && matchesZone;
    });
  }, [currentCard, currentTransactions, filterType, selectedMonth, selectedYear, startDate, endDate, historySearchQuery, historyZoneFilter]);

  // Calculate filtered metrics based on date range
  const filteredMetrics = useMemo(() => {
    if (!currentCard || !overviewData) return overviewData?.metrics || [];
    
    if (filteredTransactions.length === 0) return overviewData.metrics;
    
    // Calculate metrics from filtered transactions
    const purchases = filteredTransactions.filter(t => t.amount > 0);
    const payments = filteredTransactions.filter(t => t.amount < 0);
    
    const totalSpending = purchases.reduce((sum, t) => sum + t.amount, 0);
    const totalPayments = payments.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const avgTransaction = purchases.length > 0 ? totalSpending / purchases.length : 0;
    
    const formatCurrency = (amount: number) => `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    return [
      { 
        label: 'Total Spending', 
        value: formatCurrency(totalSpending), 
        info: true, 
        description: `${purchases.length} transaction${purchases.length !== 1 ? 's' : ''}` 
      },
      { 
        label: 'Total Payments', 
        value: formatCurrency(totalPayments), 
        info: true, 
        description: `${payments.length} payment${payments.length !== 1 ? 's' : ''}` 
      },
      { 
        label: 'Current Balance', 
        value: formatCurrency(currentCard.currentBalance), 
        info: true, 
        description: `Available: ${formatCurrency(currentCard.availableCredit)}` 
      },
      { 
        label: 'Avg Transaction', 
        value: formatCurrency(avgTransaction), 
        info: true, 
        description: purchases.length > 0 ? 'Per purchase' : 'No purchases' 
      },
    ];
  }, [currentCard, filteredTransactions, overviewData]);

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

    if (isHorizontalSwipe && Math.abs(distanceX) > minSwipeDistance) {
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

  // Filter history data based on search and filters
  const filteredHistory = useMemo(() => {
    if (!overviewData?.history) return [];
    
    return overviewData.history.filter(row => {
      // Search filter - searches in month field
      const matchesSearch = !historySearchQuery || 
        row.month.toLowerCase().includes(historySearchQuery.toLowerCase());
      
      // Zone filter
      const matchesZone = !historyZoneFilter || row.zone === historyZoneFilter;
      
      return matchesSearch && matchesZone;
    });
  }, [overviewData?.history, historySearchQuery, historyZoneFilter]);
  
  // Get available zones for filter dropdown
  const availableZones = useMemo(() => {
    if (viewMode === 'daily') {
      const zones = new Set(filteredTransactions.map(txn => txn.zone).filter(Boolean));
      return Array.from(zones).sort();
    } else {
      if (!overviewData?.history) return [];
      const zones = new Set(overviewData.history.map(row => row.zone));
      return Array.from(zones).sort();
    }
  }, [viewMode, filteredTransactions, overviewData?.history]);

  // Generate month options (last 24 months)
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = d.toISOString().slice(0, 7); // YYYY-MM
      const label = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    return options;
  }, []);

  // Generate year options (last 5 years)
  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());
  }, []);

  // Safety check: if no current card, don't render
  if (!currentCard) {
    return null;
  }

  // Show loading state while data is being fetched
  if (isLoadingData || !overviewData) {
    return <CardOverviewSkeleton />;
  }

  // Determine zone text based on utilization percentage
  const getZoneText = (percentage: number): string => {
    if (percentage <= 25) return 'Safe Zone';
    if (percentage <= 30) return 'Caution Zone';
    return 'Danger Zone';
  };
  
  const zoneText = getZoneText(overviewData.utilizationPercentage);

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
        <button
          onClick={onAddCard}
          className="flex items-center gap-2 self-start whitespace-nowrap rounded-lg border-2 border-indigo-600 px-4 py-2 font-medium text-indigo-600 transition-colors hover:bg-indigo-50 dark:border-indigo-500 dark:text-indigo-500 dark:hover:bg-indigo-950/30"
        >
          <Plus className="h-4 w-4" />
          Add Card
        </button>
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
              {getCurrentDateFilter().label}
            </p>
          </div>
          
          {/* Date Filter Controls */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as 'month' | 'range' | 'year')}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
            >
              <option value="month">Month</option>
              <option value="year">Year</option>
              <option value="range">Date Range</option>
            </select>
            
            {filterType === 'month' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              >
                {monthOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}
            
            {filterType === 'year' && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
              >
                {yearOptions.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            )}
            
            {filterType === 'range' && (
              <div className="flex gap-2 items-center">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
                />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {filteredMetrics.map((metric, index) => (
            <div
              key={index}
              className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950"
            >
              <div className="mb-2 flex items-start justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {metric.label}
                </span>
                {metric.info && (
                  <Info className="h-4 w-4 flex-shrink-0 text-gray-400 dark:text-gray-600" />
                )}
              </div>
              <p className="mb-1 text-2xl font-bold text-gray-900 dark:text-white">
                {metric.value}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {metric.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* History Section */}
      <div className="mb-8">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {currentCard.bank} {currentCard.lastFour} History
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
              {viewMode === 'daily' 
                ? `Showing ${filteredTransactions.length} transaction${filteredTransactions.length !== 1 ? 's' : ''} for ${getCurrentDateFilter().label}`
                : `Monthly summary for ${currentCard.bank} ${currentCard.name} (****${currentCard.lastFour})`
              }
            </p>
          </div>
          
          <div className="flex gap-2">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg border border-gray-200 dark:border-gray-800">
              <button
                onClick={() => setViewMode('daily')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'daily'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setViewMode('monthly')}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'monthly'
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-900'
                }`}
              >
                Monthly
              </button>
            </div>
            
            <button className="px-4 py-2 text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
              Download Statement
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={historySearchQuery}
              onChange={(e) => setHistorySearchQuery(e.target.value)}
              placeholder={viewMode === 'daily' ? "Search description, date..." : "Search month, date, total balance..."}
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:placeholder-gray-400"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={historyZoneFilter}
              onChange={(e) => setHistoryZoneFilter(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:hover:bg-gray-900"
            >
              <option value="">All Zones</option>
              {availableZones.map(zone => (
                <option key={zone} value={zone}>{zone}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        {isLoadingTransactions ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : viewMode === 'daily' ? (
          <DailyTransactionTable data={filteredTransactions} card={currentCard} />
        ) : (
          <CardHistoryTable data={filteredHistory} card={currentCard} />
        )}

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {viewMode === 'daily' 
              ? `Showing ${filteredTransactions.length} transaction${filteredTransactions.length !== 1 ? 's' : ''}`
              : 'Page 1 of 1'
            }
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
    </div>
  );
}
