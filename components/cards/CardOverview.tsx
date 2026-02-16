/**
 * Card Overview Dashboard
 * Main view showing card details, metrics, and history
 */

'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Info, Download, Search, Filter, X } from 'lucide-react';

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
  onDisconnectCard?: () => void;
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

const recommendedArticles = [
  {
    id: '1',
    title: 'Credit Counseling Services in Canada',
    subtitle: 'Who to expect',
    tag: 'Debt Recovery & Crisis Management',
    readTime: '2 min read',
    image: '/placeholder-1.jpg',
  },
  {
    id: '2',
    title: 'How Mortgage Pre-Approvals Affect Your Credit',
    subtitle: 'Understanding the home-buying credit impact',
    tag: 'Advanced Learn',
    readTime: '3 segs quick',
    image: '/placeholder-2.jpg',
  },
  {
    id: '3',
    title: "Warning Signs You're Heading into Debt Trouble",
    subtitle: 'and help you shouldn\'t ignore',
    tag: 'Debt Recovery & Crisis Management',
    readTime: '1 min warning post',
    image: '/placeholder-3.jpg',
  },
];

// Volume-style progress bar component
function VolumeProgressBar({ percentage = 20 }: { percentage?: number }) {
  // Create 40 bars with varying heights
  const bars = Array.from({ length: 40 }, (_, i) => {
    const position = (i / 40) * 100;
    let height = 'h-2';
    let color = 'bg-gray-300 dark:bg-gray-700';
    
    // Green zone (0-30%)
    if (position < 30) {
      if (i % 4 === 0) height = 'h-6';
      else if (i % 2 === 0) height = 'h-4';
      else height = 'h-3';
      
      if (position <= percentage) {
        color = 'bg-green-500';
      }
    }
    // Yellow zone (30-60%)
    else if (position < 60) {
      if (i % 4 === 0) height = 'h-8';
      else if (i % 2 === 0) height = 'h-6';
      else height = 'h-4';
      
      if (position <= percentage) {
        color = 'bg-yellow-500';
      }
    }
    // Red zone (60-100%)
    else {
      if (i % 4 === 0) height = 'h-10';
      else if (i % 2 === 0) height = 'h-8';
      else height = 'h-6';
      
      if (position <= percentage) {
        color = 'bg-red-500';
      }
    }
    
    return { height, color };
  });

  return (
    <div className="flex items-end justify-center gap-0.5 h-12 px-4">
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
    if (onDisconnectCard) {
      onDisconnectCard();
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-indigo-600 dark:text-indigo-500 mb-2">
            Card Overview
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Information shown here is based on the card data you connected. Always double-check important details with your bank to be sure everything is accurate.
          </p>
        </div>
        <button
          onClick={onAddCard}
          className="px-4 py-2 rounded-lg border-2 border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-500 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors flex items-center gap-2 whitespace-nowrap self-start"
        >
          <Plus className="h-4 w-4" />
          Add Card
        </button>
      </div>

      {/* Description Box */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 md:p-6 mb-8 border border-gray-200 dark:border-gray-800">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Description</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-3 py-1 bg-green-500 text-white rounded text-xs font-medium">
            0-10% is safe
          </span>
          <span className="px-3 py-1 bg-orange-500 text-white rounded text-xs font-medium">
            10-25% is caution
          </span>
          <span className="px-3 py-1 bg-red-500 text-white rounded text-xs font-medium">
            25-28% is danger!
          </span>
        </div>
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-semibold text-gray-900 dark:text-white">Credit utilization rate</span>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              The reason for the scale is because anything above 30% lowers points every month as recommended by the Canadian credit system.
            </p>
          </div>
          <div>
            <span className="font-semibold text-gray-900 dark:text-white">Note</span>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Even if you stay below 30% utilization rate, if there is a sharp increase in your utilization rate (within 30%), you are at higher risk of losing credit points.
            </p>
          </div>
        </div>
      </div>

      {/* Card Carousel */}
      <div className="mb-8">
        <div className="relative max-w-2xl mx-auto">
          {/* Navigation Buttons */}
          {cards.length > 1 && (
            <>
              <button
                onClick={handlePrevCard}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-16 z-10 w-12 h-12 bg-white dark:bg-gray-900 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                disabled={currentCardIndex === 0 || isTransitioning}
              >
                <ChevronLeft className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </button>

              <button
                onClick={handleNextCard}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-16 z-10 w-12 h-12 bg-white dark:bg-gray-900 rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                disabled={currentCardIndex === cards.length - 1 || isTransitioning}
              >
                <ChevronRight className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              </button>
            </>
          )}

          {/* Card with 3D effect */}
          <div className="perspective-1000">
            {/* Card back (shadow layer) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[90%] h-20 bg-gray-400 dark:bg-gray-700 rounded-t-2xl -z-10"></div>
            <div className="absolute top-5 left-1/2 -translate-x-1/2 w-[95%] h-16 bg-gray-300 dark:bg-gray-800 rounded-t-2xl -z-20"></div>

            {/* Main Card Display */}
            <div 
              className={`bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 rounded-2xl p-6 md:p-8 shadow-2xl aspect-[1.586/1] relative overflow-hidden transition-opacity duration-300 ${
                isTransitioning ? 'opacity-0' : 'opacity-100'
              }`}
            >
              {/* Decorative wave element */}
              <div className="absolute top-0 right-0 w-96 h-96 opacity-20">
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white to-transparent rounded-full -translate-y-48 translate-x-48 rotate-45"></div>
              </div>
              
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div className="flex items-start justify-between">
                  <p className="text-white/90 text-base md:text-lg font-medium">Credit</p>
                  <div className="text-right">
                    <p className="text-white font-bold text-xl md:text-2xl">{currentCard.type.toUpperCase()}</p>
                  </div>
                </div>
                <div>
                  <p className="text-white/90 text-base md:text-lg mb-3">Kristin Mumbi</p>
                  <p className="text-white text-lg md:text-xl tracking-[0.2em] font-medium">
                    4556 - 5642 - 0695 - {currentCard.lastFour}
                  </p>
                </div>
              </div>

              {/* Disconnect button on card */}
              {cards.length > 1 && (
                <button
                  onClick={() => setShowDisconnectConfirm(true)}
                  className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  title="Disconnect card"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              )}
            </div>
          </div>

          {/* Card Status */}
          <div className="text-center mt-8">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              This card is in the safe zone!
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
              Remember to payback on time to keep it consistent
            </p>
            
            {/* Volume-style Progress Bar */}
            <div className="max-w-2xl mx-auto mb-2">
              <VolumeProgressBar percentage={20} />
            </div>
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
              <span className="font-medium">0-30% Safe</span>
              <span>Caution</span>
              <span>Danger</span>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Metrics</h2>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option>This month</option>
            <option>Last month</option>
            <option>Last 3 months</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">{metric.label}</span>
                {metric.info && (
                  <Info className="h-4 w-4 text-gray-400 dark:text-gray-600 flex-shrink-0" />
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{metric.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">{metric.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* History Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">History</h2>
          <button className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
            Download Statement
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search month, date, total balance, and..."
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
              2025 <ChevronRight className="h-4 w-4" />
            </button>
            <button className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
              Filter <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900 dark:bg-gray-950 text-white text-left text-sm">
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
                <tr key={index} className="border-b border-gray-200 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                  <td className="px-4 py-4">
                    <span className={`inline-block px-3 py-1 rounded text-xs font-medium ${
                      row.month === 'December' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      row.month === 'November' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                      row.month === 'October' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      row.month === 'September' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' :
                      row.month === 'August' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      row.month === 'July' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      row.month === 'June' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                      row.month === 'May' ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400' :
                      row.month === 'April' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                      row.month === 'March' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      row.month === 'February' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                      'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    }`}>
                      {row.month.substring(0, 3)}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">{row.date}</td>
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">{row.totalBalance}</td>
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">{row.creditInterest}</td>
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">{row.feeCharge}</td>
                  <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">{row.payment}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-block px-3 py-1 rounded text-xs font-medium ${
                      row.status === 'paid' 
                        ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {row.status === 'paid' ? 'paid' : 'Sample redacted'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Page 1 of 1</p>
        </div>
      </div>


      {/* Disconnect Confirmation Modal */}
      {showDisconnectConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-950 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">Disconnect Card?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to disconnect {currentCard.name} ending in {currentCard.lastFour}? This action will remove all associated data from your dashboard.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDisconnectConfirm(false)}
                className="flex-1 px-6 py-3 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnect}
                className="flex-1 px-6 py-3 rounded-xl bg-red-600 text-white font-medium hover:bg-red-700 transition-colors"
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
