/**
 * Card Overview Dashboard
 * Main view showing card details, metrics, and history
 */

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Info, Search, X } from 'lucide-react';
import type { ConnectedCard, CardOverviewData } from '@/types/card.types';
import { cardService } from '@/services/card.service';
import { CreditCardDisplay } from './CreditCardDisplay';
import { CardHistoryTable } from './CardHistoryTable';
import { VolumeProgressBar } from './VolumeProgressBar';
import { CardOverviewSkeleton } from './CardOverviewSkeleton';
import { useUser } from '@/hooks/useAuth';

interface CardOverviewProps {
  card: ConnectedCard;
  onAddCard: () => void;
  onDisconnectCard?: (cardId: string) => void;
  allCards?: ConnectedCard[];
}

export function CardOverview({ card, onAddCard, onDisconnectCard, allCards = [] }: CardOverviewProps) {
  const { profile } = useUser();
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState('This month');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Track which cards have had their data loaded
  const loadedCardIds = useRef(new Set<string>());
  
  // History table filters
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historyZoneFilter, setHistoryZoneFilter] = useState<string>('');
  
  // Touch/swipe state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | 'down' | null>(null);

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

  // Minimum swipe distance (in pixels)
  const minSwipeDistance = 50;

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

    if (isHorizontalSwipe) {
      // Left/Right swipe - slide animation
      if (Math.abs(distanceX) > minSwipeDistance) {
        if (distanceX > 0) {
          // Swiped left - go to next card
          setSwipeDirection('left');
          handleNextCard();
        } else {
          // Swiped right - go to previous card
          setSwipeDirection('right');
          handlePrevCard();
        }
      }
    } else {
      // Up/Down swipe - shuffle animation
      if (Math.abs(distanceY) > minSwipeDistance) {
        if (distanceY > 0) {
          // Swiped up - go to next card
          setSwipeDirection('up');
          handleNextCard();
        } else {
          // Swiped down - go to previous card
          setSwipeDirection('down');
          handlePrevCard();
        }
      }
    }

    // Reset touch state
    setTouchStart(null);
    setTouchEnd(null);
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentCardIndex(currentCardIndex - 1);
        setIsTransitioning(false);
        setSwipeDirection(null);
      }, 300);
    }
  };

  const handleNextCard = () => {
    if (currentCardIndex < cards.length - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentCardIndex(currentCardIndex + 1);
        setIsTransitioning(false);
        setSwipeDirection(null);
      }, 300);
    }
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
  // Note: These useMemo hooks must come before any early returns to comply with Rules of Hooks
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
    if (!overviewData?.history) return [];
    const zones = new Set(overviewData.history.map(row => row.zone));
    return Array.from(zones).sort();
  }, [overviewData?.history]);

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
        <div className="relative mx-auto max-w-2xl px-4 sm:px-8 md:px-16 lg:px-20">
          {/* Navigation Buttons - Hidden on mobile, visible on md and up */}
          {cards.length > 1 && (
            <>
              <button
                onClick={handlePrevCard}
                className="absolute left-0 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-lg transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 sm:h-12 sm:w-12 md:flex"
                disabled={currentCardIndex === 0 || isTransitioning}
              >
                <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400 sm:h-6 sm:w-6" />
              </button>

              <button
                onClick={handleNextCard}
                className="absolute right-0 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-lg transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 sm:h-12 sm:w-12 md:flex"
                disabled={
                  currentCardIndex === cards.length - 1 || isTransitioning
                }
              >
                <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400 sm:h-6 sm:w-6" />
              </button>
            </>
          )}

          {/* Card Stack Container */}
          <div 
            className="relative pb-4 pt-8 touch-pan-y md:touch-auto"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Third card in stack - show if there's a card at +2 position */}
            {currentCardIndex + 2 < cards.length && !isTransitioning && (
              <div className="pointer-events-none absolute left-1/2 top-0 z-0 w-[88%] -translate-x-1/2">
                <div className="h-32 overflow-hidden rounded-t-2xl opacity-60 shadow-sm">
                  <CreditCardDisplay
                    bank={cards[currentCardIndex + 2].bank}
                    name={cardholderName}
                    type={cards[currentCardIndex + 2].type}
                    lastFour={cards[currentCardIndex + 2].lastFour}
                    gradientIndex={currentCardIndex + 2}
                    size="large"
                  />
                </div>
              </div>
            )}

            {/* Second card in stack - show if there's a card at +1 position */}
            {currentCardIndex + 1 < cards.length && !isTransitioning && (
              <div className="pointer-events-none absolute left-1/2 top-5 z-10 w-[94%] -translate-x-1/2">
                <div className="h-40 overflow-hidden rounded-t-2xl opacity-80 shadow-md">
                  <CreditCardDisplay
                    bank={cards[currentCardIndex + 1].bank}
                    name={cardholderName}
                    type={cards[currentCardIndex + 1].type}
                    lastFour={cards[currentCardIndex + 1].lastFour}
                    gradientIndex={currentCardIndex + 1}
                    size="large"
                  />
                </div>
              </div>
            )}

            {/* Front card (current card) */}
            <div
              className={`relative z-20 top-5 transition-all duration-300 ${
                isTransitioning 
                  ? swipeDirection === 'left' || swipeDirection === 'right'
                    ? swipeDirection === 'left' 
                      ? 'opacity-0 -translate-x-full'
                      : 'opacity-0 translate-x-full'
                    : swipeDirection === 'up' || swipeDirection === 'down'
                      ? 'opacity-0 scale-90'
                      : 'opacity-0'
                  : 'opacity-100 translate-x-0 scale-100'
              }`}
            >
              <CreditCardDisplay
                bank={currentCard.bank}
                name={cardholderName}
                type={currentCard.type}
                lastFour={currentCard.lastFour}
                gradientIndex={currentCardIndex}
                size="large"
              />

              {/* Disconnect button on card */}
              <button
                onClick={() => setShowDisconnectConfirm(true)}
                className="absolute right-4 top-4 z-30 rounded-full bg-white/10 p-2 transition-colors hover:bg-white/20"
                title="Disconnect card"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          </div>

          {/* Card Status and Progress */}
          <div className="mt-6 sm:mt-8">
            <div className="mb-4 text-center">
              <p className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">
                This card is in the {zoneText}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Remember to payback on time to keep it consistent
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
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Metrics
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
              Sample data for {currentCard.bank} {currentCard.name}
            </p>
          </div>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white"
          >
            <option>This month</option>
            <option>Last month</option>
            <option>Last 3 months</option>
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {overviewData.metrics.map((metric, index) => (
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
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              History
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
              Currently showing sample data for {currentCard.bank}{' '}
              {currentCard.name} (****{currentCard.lastFour})
            </p>
          </div>
          <button className="px-4 py-2 text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            Download Statement
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={historySearchQuery}
              onChange={(e) => setHistorySearchQuery(e.target.value)}
              placeholder="Search month, date, total balance, and..."
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
        <CardHistoryTable data={filteredHistory} />

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Page 1 of 1
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
