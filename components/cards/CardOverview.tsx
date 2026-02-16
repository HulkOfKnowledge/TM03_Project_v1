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

// Sample data
const metrics = [
  { label: 'Credit balance', value: '$2,000', info: true, description: '$2,000 to be paid' },
  { label: 'Due date', value: '19/12/2025', info: true, description: '2 168 hours left' },
  { label: 'Transactions this month', value: '25', info: true, description: '6 Your record' },
  { label: 'Payment Amount', value: '$200', info: true, description: '+$125 this month' },
];

const historyData = [
  { month: 'December', date: '12/12/2024', totalBalance: '$10,000.45', creditInterest: '$10,000', feeCharge: '$250', payment: '$200', status: 'paid' },
  { month: 'November', date: '11/11/2024', totalBalance: '$12,000.45', creditInterest: '$10,000', feeCharge: '$250', payment: '$200', status: 'sample-redacted' },
  { month: 'October', date: '10/10/2024', totalBalance: '$900.45', creditInterest: '$10,000', feeCharge: '$250', payment: '-$250', status: 'sample-redacted' },
  { month: 'September', date: '09/09/2024', totalBalance: '$700.45', creditInterest: '$10,000', feeCharge: '$250', payment: '$200', status: 'sample-redacted' },
  { month: 'August', date: '08/08/2024', totalBalance: '$800.15', creditInterest: '$10,000', feeCharge: '$250', payment: '-$250', status: 'sample-redacted' },
  { month: 'July', date: '07/07/2024', totalBalance: '$12,000.40', creditInterest: '$10,000', feeCharge: '$250', payment: '$200', status: 'sample-redacted' },
  { month: 'June', date: '06/06/2024', totalBalance: '$17,000.45', creditInterest: '$10,000', feeCharge: '$350', payment: '$200', status: 'sample-redacted' },
  { month: 'May', date: '05/05/2024', totalBalance: '$12,000.40', creditInterest: '$10,000', feeCharge: '$10.00', payment: '$200', status: 'sample-redacted' },
  { month: 'April', date: '04/04/2024', totalBalance: '$900.45', creditInterest: '$10,000', feeCharge: '$250', payment: '$200', status: 'sample-redacted' },
  { month: 'March', date: '03/03/2024', totalBalance: '$12,000.45', creditInterest: '$10,000', feeCharge: '$200', payment: '-$200', status: 'sample-redacted' },
  { month: 'February', date: '02/02/2024', totalBalance: '$900.45', creditInterest: '$10,000', feeCharge: '$250', payment: '$200', status: 'sample-redacted' },
  { month: 'January', date: '01/01/2024', totalBalance: '$12,000.45', creditInterest: '$10,000', feeCharge: '$750', payment: '-$200', status: 'sample-redacted' },
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
              <div className="pointer-events-none absolute left-1/2 top-4 z-10 w-[94%] -translate-x-1/2">
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
              className={`relative z-20 transition-opacity duration-300 ${
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
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900 text-left text-sm text-white dark:bg-gray-950">
                <th className="px-4 py-3 font-medium">Month</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Total Balance</th>
                <th className="px-4 py-3 font-medium">Credit Interest</th>
                <th className="px-4 py-3 font-medium">Fee Charge</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium">
                  Status <span className="text-orange-400">Activity</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-950">
              {historyData.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-200 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/50"
                >
                  <td className="px-4 py-4">
                    <span
                      className={`inline-block rounded px-3 py-1 text-xs font-medium ${
                        row.month === 'December'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          : row.month === 'November'
                            ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                            : row.month === 'October'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : row.month === 'September'
                                ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                                : row.month === 'August'
                                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  : row.month === 'July'
                                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                    : row.month === 'June'
                                      ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                      : row.month === 'May'
                                        ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                                        : row.month === 'April'
                                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                          : row.month === 'March'
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : row.month === 'February'
                                              ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}
                    >
                      {row.month.substring(0, 3)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                    {row.date}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                    {row.totalBalance}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                    {row.creditInterest}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                    {row.feeCharge}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                    {row.payment}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-block rounded px-3 py-1 text-xs font-medium ${
                        row.status === 'paid'
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {row.status === 'paid' ? 'paid' : 'Sample redacted'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
