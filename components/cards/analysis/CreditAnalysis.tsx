/**
 * Credit Analysis Component
 * Consolidated view of all credit card information
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Info, TrendingUp, TrendingDown, ChevronUp, Search } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

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

// Payment history data
const paymentHistory = [
  { month: 'December', statementBalance: '$900.45', amountPaid: '$700', paymentStatus: 'On Time', peakUsage: '45%', alerts: 'High Usage' },
  { month: 'November', statementBalance: '$25,000.45', amountPaid: '$900.45', paymentStatus: 'On Time', peakUsage: '45%', alerts: 'High Usage' },
  { month: 'October', statementBalance: '$900.45', amountPaid: '$1100', paymentStatus: 'On Time', peakUsage: '45%', alerts: 'High Usage' },
  { month: 'September', statementBalance: '$900.45', amountPaid: '$1000', paymentStatus: 'Late', peakUsage: '45%', alerts: 'High Usage' },
  { month: 'August', statementBalance: '$900.45', amountPaid: '$900.45', paymentStatus: 'On Time', peakUsage: '18%', alerts: '-' },
];

export function CreditAnalysis({ connectedCardsCount }: CreditAnalysisProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('Yearly');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Detect theme changes
  useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setTheme(isDark ? 'dark' : 'light');
    };

    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  const isDark = theme === 'dark';
  const textColor = isDark ? '#9CA3AF' : '#6B7280';
  const gridColor = isDark ? '#374151' : '#E5E7EB';
  const lineColors = {
    safe: isDark ? '#D1D5DB' : '#9CA3AF',
    caution: isDark ? '#6B7280' : '#4B5563',
    danger: isDark ? '#1F2937' : '#111827',
  };

  // Utilization Rate Chart Data
  const utilizationChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Safe',
        data: [100, 120, 140, 150, 160, 180, 200, 220, 240, 260, 280, 300],
        borderColor: lineColors.safe,
        backgroundColor: 'transparent',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: 'Caution',
        data: [80, 100, 120, 130, 140, 150, 160, 180, 200, 220, 240, 260],
        borderColor: lineColors.caution,
        backgroundColor: 'transparent',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: 'Danger',
        data: [60, 80, 100, 110, 120, 130, 140, 160, 180, 200, 220, 240],
        borderColor: lineColors.danger,
        backgroundColor: 'transparent',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };

  const utilizationChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          color: gridColor,
          drawTicks: false,
        },
        ticks: {
          color: textColor,
          font: {
            size: 12,
          },
        },
        border: {
          display: false,
        },
      },
      y: {
        min: 0,
        max: 500,
        grid: {
          color: gridColor,
          drawTicks: false,
        },
        ticks: {
          color: textColor,
          font: {
            size: 12,
          },
          callback: function(value) {
            return value + 'k';
          },
          stepSize: 100,
        },
        border: {
          display: false,
        },
      },
    },
    interaction: {
      mode: 'index',
      intersect: false,
    },
  };

  // Spending Patterns Chart Data
  const spendingChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Spending',
        data: [80, 120, 150, 180, 200, 170, 160, 200, 250, 300, 350, 400],
        borderColor: isDark ? '#6B7280' : '#111827',
        backgroundColor: 'transparent',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const spendingChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      x: {
        grid: {
          color: gridColor,
          drawTicks: false,
        },
        ticks: {
          color: textColor,
          font: {
            size: 12,
          },
        },
        border: {
          display: false,
        },
      },
      y: {
        min: 0,
        max: 500,
        grid: {
          color: gridColor,
          drawTicks: false,
        },
        ticks: {
          color: textColor,
          font: {
            size: 12,
          },
          callback: function(value) {
            return value + 'k';
          },
          stepSize: 100,
        },
        border: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-start md:justify-between">
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-bold text-brand mb-3">
            Credit Analysis
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400">
            Understand your card breakdowns at a glance
          </p>
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="self-start rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white sm:px-4 sm:text-sm md:self-auto"
        >
          <option>This month</option>
          <option>Yearly</option>
          <option>Last 3 months</option>
        </select>
      </div>

      {/* Top Metrics */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-2">
        {/* Top Row - Two Cards */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 sm:p-6">
          <div className="mb-3 flex items-start justify-between">
            <span className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
              Total Credit Available
            </span>
            <Info className="h-3 w-3 flex-shrink-0 text-gray-400 dark:text-gray-600 sm:h-4 sm:w-4" />
          </div>
          <p className="mb-2 text-3xl text-gray-900 dark:text-white sm:text-4xl md:text-5xl">
            ${totalCreditAvailable.toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-500">
            <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">0.5% Increase</span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 sm:p-6">
          <div className="mb-3 flex items-start justify-between">
            <span className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
              Total Amount Owed
            </span>
            <Info className="h-3 w-3 flex-shrink-0 text-gray-400 dark:text-gray-600 sm:h-4 sm:w-4" />
          </div>
          <p className="mb-2 text-3xl text-gray-900 dark:text-white sm:text-4xl md:text-5xl">
            ${totalAmountOwed.toLocaleString()}
          </p>
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-500">
            <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm">0.5% Increase</span>
          </div>
        </div>

        {/* Bottom Row - Full Width Card with Split Layout */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 sm:p-6 lg:col-span-2">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Left side - Title and description */}
            <div className="flex-shrink-0">
              <span className="mb-2 block text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
                Credit Utilization
              </span>
              <p className="mb-2 text-3xl text-gray-900 dark:text-white sm:text-4xl md:text-5xl">
                {connectedCardsCount} Cards
              </p>
              <p className="inline-block rounded bg-gray-50 px-3 py-1.5 text-[10px] text-gray-500 dark:bg-gray-900 dark:text-gray-500 sm:text-xs">
                This is a suggested amount, be sure to make your personal
                calculations as well
              </p>
            </div>

            {/* Right side - Card balances with dividers */}
            <div className="flex items-center gap-0">
              {cardBalances.map((card, index) => (
                <div key={index} className="flex items-center">
                  {index > 0 && (
                    <div className="mx-4 h-12 w-px bg-gray-200 dark:bg-gray-800 sm:mx-6 sm:h-16"></div>
                  )}
                  <div className="flex flex-col items-center">
                    <p className="mb-1 text-[10px] text-gray-500 dark:text-gray-500 sm:text-xs">
                      {card.name}
                    </p>
                    <p className="text-2xl text-gray-900 dark:text-white sm:text-3xl md:text-4xl">
                      ${card.balance}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Overall Utilization Rate */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 sm:mb-8 sm:p-6">
        <div className="mb-6">
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
            Overall Utilization Rate
          </h2>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                  {creditUtilizationRate}%
                </span>
                <div className="flex items-center gap-1 text-gray-500 dark:text-gray-500">
                  <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="text-xs sm:text-sm">0.5%</span>
                </div>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-500 sm:text-sm">
                Utilization percentage
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500 sm:h-3 sm:w-3"></div>
                <span className="text-[10px] text-gray-600 dark:text-gray-400 sm:text-xs">
                  Safe
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-gray-600 dark:bg-gray-700 sm:h-3 sm:w-3"></div>
                <span className="text-[10px] text-gray-600 dark:text-gray-400 sm:text-xs">
                  Caution
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-gray-900 dark:bg-gray-300 sm:h-3 sm:w-3"></div>
                <span className="text-[10px] text-gray-600 dark:text-gray-400 sm:text-xs">
                  Danger
                </span>
              </div>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white sm:px-3"
              >
                <option>Yearly</option>
                <option>Monthly</option>
              </select>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64 sm:h-80">
          <Line data={utilizationChartData} options={utilizationChartOptions} />
        </div>
      </div>

      {/* Spending Patterns */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 sm:mb-8 sm:p-6">
        <div className="mb-6">
          <h2 className="mb-4 text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
            Spending Patterns
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
                $400
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-500 sm:text-sm">
                Spent
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-500 sm:text-sm">
                Average Amount
              </span>
            </div>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="self-start rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white sm:self-auto sm:px-3"
            >
              <option>Yearly</option>
              <option>Monthly</option>
            </select>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64 sm:h-80">
          <Line data={spendingChartData} options={spendingChartOptions} />
        </div>
      </div>

      {/* Payment History */}
      <div className="mb-6 sm:mb-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
            Payment History
          </h2>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900 sm:px-4 sm:text-sm">
              2025
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900 sm:px-4 sm:text-sm">
              Filter
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, transaction, anything"
            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:placeholder-gray-500"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gray-100 text-left text-xs dark:bg-gray-900 sm:text-sm">
                <th className="px-3 py-3 font-medium text-gray-700 dark:text-gray-300 sm:px-4">
                  <div className="flex items-center gap-1.5">
                    Month
                    <ChevronUp className="h-3 w-3" />
                  </div>
                </th>
                <th className="px-3 py-3 font-medium text-gray-700 dark:text-gray-300 sm:px-4">
                  Statement Balance
                </th>
                <th className="px-3 py-3 font-medium text-gray-700 dark:text-gray-300 sm:px-4">
                  Amount Paid
                </th>
                <th className="px-3 py-3 font-medium text-gray-700 dark:text-gray-300 sm:px-4">
                  Payment Status
                </th>
                <th className="px-3 py-3 font-medium text-gray-700 dark:text-gray-300 sm:px-4">
                  Peak Usage
                </th>
                <th className="px-3 py-3 font-medium text-gray-700 dark:text-gray-300 sm:px-4">
                  Alerts
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-950">
              {paymentHistory.map((row, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-200 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/50"
                >
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-900 dark:text-white sm:px-4 sm:py-4 sm:text-sm">
                    {row.month}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-900 dark:text-white sm:px-4 sm:py-4 sm:text-sm">
                    {row.statementBalance}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-900 dark:text-white sm:px-4 sm:py-4 sm:text-sm">
                    {row.amountPaid}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs sm:px-4 sm:py-4 sm:text-sm">
                    <span
                      className={`${
                        row.paymentStatus === 'Late'
                          ? 'text-gray-400 dark:text-gray-500'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {row.paymentStatus}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-500 dark:text-gray-400 sm:px-4 sm:py-4 sm:text-sm">
                    {row.peakUsage}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-900 dark:text-white sm:px-4 sm:py-4 sm:text-sm">
                    {row.alerts}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recommended Actions */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900 sm:p-6">
        <h2 className="mb-2 text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
          Recommended Actions
        </h2>
        <p className="mb-4 text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
          Here is what you need to do based on your credit analysis
        </p>

        <div className="space-y-4">
          <p className="text-xs leading-relaxed text-gray-700 dark:text-gray-300 sm:text-sm">
            Suspendisse potenti. Id molestie, mus vel egestas consilis, psum nec
            pariatis lacus, sit egestas mus sapien at amet lobortis. Suspendisse
            non dignissim felis. In ac ligula orci. In vitae consequat enim,
            eges get eros sodales sagittis. Nunc consectetur lacus fusce, at
            semper massa sempor quam. Vestibulum ante ipsum placibus in faucibus
            neque odio dales portiter lorem utrum nec dictrus ulicies purus.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 sm:h-10 sm:w-10">
                <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400 sm:h-5 sm:w-5" />
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
                  Enable payment reminders - Get Started
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
                  Never miss a due date and increase your score effortlessly
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 sm:h-10 sm:w-10">
                <TrendingDown className="h-4 w-4 text-indigo-600 dark:text-indigo-400 sm:h-5 sm:w-5" />
              </div>
              <div>
                <h3 className="mb-1 text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
                  Set usage alerts - Get Started
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
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
