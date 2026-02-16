/**
 * Card Overview Dashboard
 * Main view showing card details, metrics, and history
 */

'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Info, Search, Filter, X } from 'lucide-react';
import { CreditCardDisplay } from './CreditCardDisplay';

interface ConnectedCard {
  id: string;
  name: string;
  bank: string;
  type: 'visa' | 'mastercard';
  lastFour: string;
}

interface CardOverviewProps {
  card: ConnectedCard;
  onAddCard: () => void;
  onDisconnectCard?: (cardId: string) => void;
  allCards?: ConnectedCard[];
}

// Add these interfaces at the top with other interfaces
interface HistoryRow {
  month: string;
  zone: 'Safe' | 'Caution' | 'Danger';
  startBalance: string;
  endingBalance: string;
  peakUsage: string;
  payment: string;
}

type SortField = 'zone' | 'month' | 'startBalance' | 'endingBalance' | 'peakUsage' | 'payment';
type SortDirection = 'asc' | 'desc' | null;

// Updated history data
const updatedHistoryData: HistoryRow[] = [
  { month: 'December', zone: 'Safe', startBalance: '$900.45', endingBalance: '$700', peakUsage: '$200', payment: '-$200' },
  { month: 'November', zone: 'Danger', startBalance: '$1100', endingBalance: '$900.45', peakUsage: '$200', payment: '-$200' },
  { month: 'October', zone: 'Safe', startBalance: '$1300', endingBalance: '$1100', peakUsage: '$200', payment: '-$200' },
  { month: 'September', zone: 'Safe', startBalance: '$1000', endingBalance: '$1000', peakUsage: '-$200', payment: '-$200' },
  { month: 'August', zone: 'Caution', startBalance: '$1100', endingBalance: '$900.45', peakUsage: '$200', payment: '-$200' },
  { month: 'July', zone: 'Safe', startBalance: '$900.45', endingBalance: '$700', peakUsage: '-$200', payment: '-$200' },
  { month: 'June', zone: 'Safe', startBalance: '$500', endingBalance: '$300', peakUsage: '$200', payment: '-$200' },
  { month: 'May', zone: 'Safe', startBalance: '$800', endingBalance: '$800', peakUsage: '$0.00', payment: '-$200' },
  { month: 'April', zone: 'Safe', startBalance: '$1100', endingBalance: '$1499', peakUsage: '-$200', payment: '-$200' },
  { month: 'March', zone: 'Safe', startBalance: '$500', endingBalance: '$700', peakUsage: '$200', payment: '-$200' },
];


function HistoryTable() {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleRow = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    if (sortDirection === 'asc') return '↑';
    if (sortDirection === 'desc') return '↓';
    return null;
  };

  // Month order for sorting
  const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Zone order for sorting (Safe -> Caution -> Danger)
  const zoneOrder = { 'Safe': 1, 'Caution': 2, 'Danger': 3 };

  const sortedData = [...updatedHistoryData];
  if (sortField && sortDirection) {
    sortedData.sort((a, b) => {
      let comparison = 0;

      if (sortField === 'zone') {
        // Sort by zone: Safe -> Caution -> Danger (asc) or reverse (desc)
        comparison = zoneOrder[a.zone] - zoneOrder[b.zone];
      } else if (sortField === 'month') {
        // Sort by month chronologically
        comparison = monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
      } else {
        // Convert currency strings to numbers for sorting
        let aVal: any = a[sortField];
        let bVal: any = b[sortField];

        if (typeof aVal === 'string' && aVal.startsWith('$')) {
          aVal = parseFloat(aVal.replace(/[$,]/g, ''));
          bVal = parseFloat(bVal.replace(/[$,]/g, ''));
        }

        if (aVal < bVal) comparison = -1;
        else if (aVal > bVal) comparison = 1;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  const getZoneColor = (zone: string) => {
    switch (zone) {
      case 'Safe':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      case 'Caution':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Danger':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-100 text-left text-sm dark:bg-gray-900">
            <th 
              className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              onClick={() => handleSort('zone')}
            >
              <div className="flex items-center gap-2">
                Zone {getSortIcon('zone') && <span className="text-xs">{getSortIcon('zone')}</span>}
              </div>
            </th>
            <th 
              className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              onClick={() => handleSort('month')}
            >
              <div className="flex items-center gap-2">
                Month {getSortIcon('month') && <span className="text-xs">{getSortIcon('month')}</span>}
              </div>
            </th>
            <th 
              className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              onClick={() => handleSort('startBalance')}
            >
              <div className="flex items-center gap-2">
                Start Balance {getSortIcon('startBalance') && <span className="text-xs">{getSortIcon('startBalance')}</span>}
              </div>
            </th>
            <th 
              className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              onClick={() => handleSort('endingBalance')}
            >
              <div className="flex items-center gap-2">
                Ending Balance {getSortIcon('endingBalance') && <span className="text-xs">{getSortIcon('endingBalance')}</span>}
              </div>
            </th>
            <th 
              className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              onClick={() => handleSort('peakUsage')}
            >
              <div className="flex items-center gap-2">
                Peak Usage {getSortIcon('peakUsage') && <span className="text-xs">{getSortIcon('peakUsage')}</span>}
              </div>
            </th>
            <th 
              className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              onClick={() => handleSort('payment')}
            >
              <div className="flex items-center gap-2">
                Payment {getSortIcon('payment') && <span className="text-xs">{getSortIcon('payment')}</span>}
              </div>
            </th>
            <th className="px-4 py-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-950">
          {sortedData.map((row, index) => (
            <tr
              key={index}
              className="border-b border-gray-200 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/50"
            >
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(index)}
                    onChange={() => toggleRow(index)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className={`inline-block rounded px-3 py-1 text-xs font-medium ${getZoneColor(row.zone)}`}>
                    {row.zone}
                  </span>
                </div>
              </td>
              <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                {row.month}
              </td>
              <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                {row.startBalance}
              </td>
              <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                {row.endingBalance}
              </td>
              <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                {row.peakUsage}
              </td>
              <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                {row.payment}
              </td>
              <td className="px-4 py-4">
                <button className="text-sm text-gray-900 underline hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400">
                  View Note
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Sample data
const metrics = [
  { label: 'Credit balance', value: '$2,000', info: true, description: '$2,000 to be paid' },
  { label: 'Due date', value: '19/12/2025', info: true, description: '2 168 hours left' },
  { label: 'Transactions this month', value: '25', info: true, description: '6 Your record' },
  { label: 'Payment Amount', value: '$200', info: true, description: '+$125 this month' },
];


/**
 * Volume-style progress bar component
 * 0-25% = Safe (Green)
 * 25-29% = Warning (Yellow/Orange)
 * 30%+ = Danger (Red)
 */
function VolumeProgressBar({ percentage = 20 }: { percentage?: number }) {
  // Create 40 bars with varying heights
  const bars = Array.from({ length: 40 }, (_, i) => {
    const position = (i / 40) * 100;
    let height = 'h-2';
    let color = 'bg-gray-300 dark:bg-gray-700';
    
    // Green zone (0-25%)
    if (position < 25) {
      // Gradually increase height
      if (i % 4 === 0) height = 'h-4';
      else if (i % 3 === 0) height = 'h-3';
      else if (i % 2 === 0) height = 'h-3';
      else height = 'h-2';
      
      if (position <= percentage) {
        color = 'bg-green-500';
      }
    }
    // Warning zone (25-30%)
    else if (position < 30) {
      // Medium height bars
      if (i % 3 === 0) height = 'h-5';
      else if (i % 2 === 0) height = 'h-4';
      else height = 'h-4';
      
      if (position <= percentage) {
        color = 'bg-yellow-500';
      }
    }
    // Danger zone (30-100%)
    else {
      // Tallest bars
      if (i % 4 === 0) height = 'h-8';
      else if (i % 3 === 0) height = 'h-7';
      else if (i % 2 === 0) height = 'h-6';
      else height = 'h-5';
      
      if (position <= percentage) {
        color = 'bg-red-500';
      }
    }
    
    return { height, color };
  });

  return (
    <div className="flex items-end justify-center gap-0.5 h-10 px-4">
      {bars.map((bar, i) => (
        <div
          key={i}
          className={`w-1 rounded-t transition-all duration-300 ${bar.height} ${bar.color}`}
        />
      ))}
    </div>
  );
}

export function CardOverview({ card, onAddCard, onDisconnectCard, allCards = [] }: CardOverviewProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState('This month');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);

  // Use allCards if provided, otherwise just use the single card
  const cards = allCards.length > 0 ? allCards : [card];
  const currentCard = cards[currentCardIndex];

  // Adjust currentCardIndex if it becomes out of bounds when cards are removed
  useEffect(() => {
    if (currentCardIndex >= cards.length && cards.length > 0) {
      setCurrentCardIndex(cards.length - 1);
    }
  }, [cards.length, currentCardIndex]);

  const handlePrevCard = () => {
    if (currentCardIndex > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentCardIndex(currentCardIndex - 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleNextCard = () => {
    if (currentCardIndex < cards.length - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentCardIndex(currentCardIndex + 1);
        setIsTransitioning(false);
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

  // Safety check: if no current card, don't render
  if (!currentCard) {
    return null;
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex-1">
          <h1 className="mb-2 text-2xl font-bold text-indigo-600 dark:text-indigo-500 md:text-3xl">
            Card Overview
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
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
            0-10% is safe
          </span>
          <span className="rounded bg-orange-500 px-3 py-1 text-xs font-medium text-white">
            10-25% is caution
          </span>
          <span className="rounded bg-red-500 px-3 py-1 text-xs font-medium text-white">
            25-28% is danger!
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
          {/* Navigation Buttons - Centered on the stack */}
          {cards.length > 1 && (
            <>
              <button
                onClick={handlePrevCard}
                className="absolute left-0 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-lg transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 sm:h-12 sm:w-12"
                disabled={currentCardIndex === 0 || isTransitioning}
              >
                <ChevronLeft className="h-5 w-5 text-gray-600 dark:text-gray-400 sm:h-6 sm:w-6" />
              </button>

              <button
                onClick={handleNextCard}
                className="absolute right-0 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white shadow-lg transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-gray-800 sm:h-12 sm:w-12"
                disabled={
                  currentCardIndex === cards.length - 1 || isTransitioning
                }
              >
                <ChevronRight className="h-5 w-5 text-gray-600 dark:text-gray-400 sm:h-6 sm:w-6" />
              </button>
            </>
          )}

          {/* Card Stack Container */}
          <div className="relative pb-4 pt-8">
            {/* Third card in stack - show if there's a card at +2 position */}
            {currentCardIndex + 2 < cards.length && !isTransitioning && (
              <div className="pointer-events-none absolute left-1/2 top-0 z-0 w-[88%] -translate-x-1/2">
                <div className="h-32 overflow-hidden rounded-t-2xl opacity-60 shadow-sm">
                  <CreditCardDisplay
                    bank={cards[currentCardIndex + 2].bank}
                    name="Kristin Mumbi"
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
                    name="Kristin Mumbi"
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
              className={`relative z-20 top-5 transition-opacity duration-300 ${
                isTransitioning ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <CreditCardDisplay
                bank={currentCard.bank}
                name="Kristin Mumbi"
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
                This card is in the safe zone!
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Remember to payback on time to keep it consistent
              </p>
            </div>

            {/* Volume-style Progress Bar */}
            <div className="w-full">
              <VolumeProgressBar percentage={20} />
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
          {metrics.map((metric, index) => (
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
              placeholder="Search month, date, total balance, and..."
              className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-800 dark:bg-gray-950"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900">
              2025 <ChevronRight className="h-4 w-4" />
            </button>
            <button className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900">
              Filter <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <HistoryTable />

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
