/**
 * Credit Analysis Component
 * Consolidated view of all credit card information
 */

'use client';

import { useState } from 'react';
import { Info, TrendingUp, TrendingDown } from 'lucide-react';

interface CreditAnalysisProps {
  connectedCardsCount: number;
}

// Sample data - replace with actual data from your backend
const totalCreditAvailable = 4000;
const totalAmountOwed = 400;
const creditUtilizationRate = 25;

const cardBalances = [
  { name: 'Card 1', balance: 200 },
  { name: 'Card 2', balance: 200 },
  { name: 'Card 3', balance: 200 },
];

// Utilization data - one point per month
const utilizationData = [
  { month: 'Jan', safe: 15, caution: 0, danger: 0 },
  { month: 'Feb', safe: 18, caution: 0, danger: 0 },
  { month: 'Mar', safe: 20, caution: 0, danger: 0 },
  { month: 'Apr', safe: 22, caution: 0, danger: 0 },
  { month: 'May', safe: 23, caution: 0, danger: 0 },
  { month: 'Jun', safe: 25, caution: 0, danger: 0 },
  { month: 'Jul', safe: 28, caution: 0, danger: 0 },
  { month: 'Aug', safe: 30, caution: 2, danger: 0 },
  { month: 'Sep', safe: 32, caution: 2, danger: 0 },
  { month: 'Oct', safe: 30, caution: 0, danger: 0 },
  { month: 'Nov', safe: 28, caution: 0, danger: 0 },
  { month: 'Dec', safe: 25, caution: 0, danger: 0 },
];

// Spending patterns data
const spendingData = [
  { month: 'Jan', amount: 150 },
  { month: 'Feb', amount: 180 },
  { month: 'Mar', amount: 200 },
  { month: 'Apr', amount: 220 },
  { month: 'May', amount: 250 },
  { month: 'Jun', amount: 280 },
  { month: 'Jul', amount: 300 },
  { month: 'Aug', amount: 320 },
  { month: 'Sep', amount: 340 },
  { month: 'Oct', amount: 360 },
  { month: 'Nov', amount: 380 },
  { month: 'Dec', amount: 400 },
];

// Payment history data
const paymentHistory = [
  { month: 'December', statementBalance: '$900.45', amountPaid: '$700', paymentStatus: 'On Time', paymentDate: '-', peakUsage: '40%', notes: 'High Usage' },
  { month: 'November', statementBalance: '$25,000.45', amountPaid: '$850.45', paymentStatus: 'On Time', paymentDate: '-', peakUsage: '48%', notes: '-' },
  { month: 'October', statementBalance: '$900.45', amountPaid: '$1700', paymentStatus: 'On Time', paymentDate: '-', peakUsage: '48%', notes: '-' },
  { month: 'September', statementBalance: '$900.45', amountPaid: '$1000', paymentStatus: 'Late', paymentDate: '-', peakUsage: '40%', notes: '-' },
  { month: 'August', statementBalance: '$850.45', amountPaid: '$850.45', paymentStatus: 'On Time', paymentDate: '-', peakUsage: '18%', notes: '-' },
  { month: 'July', statementBalance: '$25,000.45', amountPaid: '$700', paymentStatus: 'On Time', paymentDate: '-', peakUsage: '99%', notes: 'Payment Late Caution Zone' },
  { month: 'June', statementBalance: '$25,000.45', amountPaid: '$300', paymentStatus: 'On Time', paymentDate: '-', peakUsage: '99%', notes: '-' },
  { month: 'May', statementBalance: '$25,000.45', amountPaid: '$800', paymentStatus: 'On Time', paymentDate: '-', peakUsage: '48%', notes: '-' },
  { month: 'April', statementBalance: '$900.45', amountPaid: '$1400', paymentStatus: 'On Time', paymentDate: '-', peakUsage: '48%', notes: '-' },
  { month: 'March', statementBalance: '$25,000.45', amountPaid: '$700', paymentStatus: 'On Time', paymentDate: '-', peakUsage: '48%', notes: '-' },
  { month: 'February', statementBalance: '$900.45', amountPaid: '$1000', paymentStatus: 'On Time', paymentDate: '-', peakUsage: '48%', notes: '-' },
  { month: 'January', statementBalance: '$25,000.45', amountPaid: '$1000', paymentStatus: 'On Time', paymentDate: '-', peakUsage: '48%', notes: '-' },
];

export function CreditAnalysis({ connectedCardsCount }: CreditAnalysisProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('This month');

  // Calculate max value for chart scaling
  const maxUtilization = Math.max(...utilizationData.map(d => d.safe + d.caution + d.danger));
  const maxSpending = Math.max(...spendingData.map(d => d.amount));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-indigo-600 dark:text-indigo-500 mb-2">
          Credit Analysis
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          Understand your card breakdown at a glance
        </p>
      </div>

      {/* Top Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {/* Total Credit Available */}
        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Credit Available</span>
            <Info className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-600 flex-shrink-0" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
            ${totalCreditAvailable.toLocaleString()}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500">Available</p>
        </div>

        {/* Total Amount Owed */}
        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Amount Owed</span>
            <Info className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 dark:text-gray-600 flex-shrink-0" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
            ${totalAmountOwed.toLocaleString()}
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500">+$134 to be paid</p>
        </div>

        {/* Credit Summary */}
        <div className="bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:col-span-2">
          <div className="flex items-start justify-between mb-2">
            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Credit Summary</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
            {connectedCardsCount} Cards
          </p>
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500 mb-2">
            This is a suggested amount we think you need to make this week
          </p>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            {cardBalances.map((card, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{card.name}</span>
                <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">${card.balance}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Overall Utilization Rate */}
      <div className="mb-6 sm:mb-8 bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1">
              Overall Utilization Rate
            </h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                {creditUtilizationRate}%
              </span>
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">of credit</span>
              <div className="flex items-center gap-3 ml-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
                  <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Safe</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500"></div>
                  <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Caution</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500"></div>
                  <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Danger</span>
                </div>
              </div>
            </div>
          </div>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white self-start sm:self-auto"
          >
            <option>Yearly</option>
            <option>This month</option>
            <option>Last 3 months</option>
          </select>
        </div>

        {/* Utilization Chart */}
        <div className="relative h-48 sm:h-64">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[10px] sm:text-xs text-gray-500 dark:text-gray-500">
            <span>100%</span>
            <span>75%</span>
            <span>50%</span>
            <span>25%</span>
            <span>0</span>
          </div>

          {/* Chart area */}
          <div className="ml-8 sm:ml-12 h-full flex items-end gap-1 sm:gap-2 pb-8">
            {utilizationData.map((data, index) => {
              const total = data.safe + data.caution + data.danger;
              const heightPercent = (total / maxUtilization) * 100;

              return (
                <div key={index} className="flex-1 flex flex-col justify-end" style={{ height: '100%' }}>
                  <div className="relative w-full" style={{ height: `${heightPercent}%` }}>
                    {/* Stacked bars */}
                    {data.danger > 0 && (
                      <div
                        className="w-full bg-red-500 rounded-t"
                        style={{ height: `${(data.danger / total) * 100}%` }}
                      ></div>
                    )}
                    {data.caution > 0 && (
                      <div
                        className="w-full bg-yellow-500"
                        style={{ height: `${(data.caution / total) * 100}%` }}
                      ></div>
                    )}
                    {data.safe > 0 && (
                      <div
                        className={`w-full bg-green-500 ${!data.caution && !data.danger ? 'rounded-t' : ''}`}
                        style={{ height: `${(data.safe / total) * 100}%` }}
                      ></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="absolute bottom-0 left-8 sm:left-12 right-0 flex justify-between text-[10px] sm:text-xs text-gray-500 dark:text-gray-500">
            {utilizationData.map((data, index) => (
              <span key={index} className="flex-1 text-center">{data.month}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Spending Patterns */}
      <div className="mb-6 sm:mb-8 bg-white dark:bg-gray-950 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-1">
              Spending Patterns
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                ${spendingData[spendingData.length - 1].amount}
              </span>
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-500">Average this month</span>
            </div>
          </div>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-lg border border-gray-200 bg-white px-3 sm:px-4 py-2 text-xs sm:text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white self-start sm:self-auto"
          >
            <option>Yearly</option>
            <option>This month</option>
            <option>Last 3 months</option>
          </select>
        </div>

        {/* Spending Chart */}
        <div className="relative h-48 sm:h-64">
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 bottom-8 flex flex-col justify-between text-[10px] sm:text-xs text-gray-500 dark:text-gray-500">
            <span>500$</span>
            <span>400$</span>
            <span>300$</span>
            <span>200$</span>
            <span>100$</span>
            <span>0</span>
          </div>

          {/* Line chart */}
          <div className="ml-8 sm:ml-12 h-full pb-8">
            <svg className="w-full h-full" preserveAspectRatio="none">
              {/* Line */}
              <polyline
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="text-indigo-600 dark:text-indigo-500"
                points={spendingData.map((data, index) => {
                  const x = (index / (spendingData.length - 1)) * 100;
                  const y = 100 - (data.amount / maxSpending) * 100;
                  return `${x},${y}`;
                }).join(' ')}
              />
              {/* Area fill */}
              <polygon
                fill="currentColor"
                fillOpacity="0.1"
                className="text-indigo-600 dark:text-indigo-500"
                points={`
                  0,100
                  ${spendingData.map((data, index) => {
                    const x = (index / (spendingData.length - 1)) * 100;
                    const y = 100 - (data.amount / maxSpending) * 100;
                    return `${x},${y}`;
                  }).join(' ')}
                  100,100
                `}
              />
            </svg>
          </div>

          {/* X-axis labels */}
          <div className="absolute bottom-0 left-8 sm:left-12 right-0 flex justify-between text-[10px] sm:text-xs text-gray-500 dark:text-gray-500">
            {spendingData.map((data, index) => (
              <span key={index} className="flex-1 text-center">{data.month}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              Payment History
            </h2>
            <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500 mt-1">
              Showing consolidated history across all connected cards
            </p>
          </div>
          <div className="flex gap-2">
            <button className="px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
              2025
            </button>
            <button className="px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors flex items-center gap-1.5">
              Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gray-900 dark:bg-gray-950 text-white text-left text-xs sm:text-sm">
                <th className="px-3 sm:px-4 py-3 font-medium">Month</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Statement Balance</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Amount Paid</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Payment Status</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Payment Date</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Peak Usage</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-950">
              {paymentHistory.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-200 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                >
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 dark:text-white whitespace-nowrap">
                    {row.month}
                  </td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 dark:text-white whitespace-nowrap">
                    {row.statementBalance}
                  </td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 dark:text-white whitespace-nowrap">
                    {row.amountPaid}
                  </td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 whitespace-nowrap">
                    <span className={`inline-block px-2 sm:px-3 py-1 rounded text-[10px] sm:text-xs font-medium ${
                      row.paymentStatus === 'On Time'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {row.paymentStatus}
                    </span>
                  </td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 dark:text-white whitespace-nowrap">
                    {row.paymentDate}
                  </td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-900 dark:text-white whitespace-nowrap">
                    {row.peakUsage}
                  </td>
                  <td className="px-3 sm:px-4 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {row.notes}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Page 1 of 1</p>
        </div>
      </div>

      {/* Recommended Actions */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
          Recommended Actions
        </h2>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
          Here is what you need to do based on your credit analysis
        </p>

        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            Suspendisse potenti. Id molestie, mus vel egestas consilis, psum nec pariatis lacus, sit egestas mus sapien at amet lobortis. Suspendisse non dignissim felis. In ac ligula orci. In vitae consequat enim, eges get eros sodales sagittis. Nunc consectetur lacus fusce, at semper massa sempor quam. Vestibulum ante ipsum placibus in faucibus neque odio dales portiter lorem utrum nec dictrus ulicies purus.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1">
                  Enable payment reminders - Get Started
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Never miss a due date and increase your score effortlessly
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mb-1">
                  Set usage alerts - Get Started
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                  Choose when Creduman warns you about high spending
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
