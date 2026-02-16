/**
 * Credit Analysis Component
 * Consolidated view of all credit card information
 */

'use client';

import { useState, useMemo } from 'react';
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
import { Line } from 'react-chartjs-2';
import { useIsDarkMode } from '@/hooks/useTheme';
import { MetricCard } from './MetricCard';
import { ChartSection } from './ChartSection';
import { PaymentHistoryTable } from './PaymentHistoryTable';

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
  const isDark = useIsDarkMode();

  // Memoize theme-dependent values
  const themeColors = useMemo(() => ({
    text: isDark ? '#9CA3AF' : '#6B7280',
    grid: isDark ? '#374151' : '#E5E7EB',
    safe: isDark ? '#D1D5DB' : '#9CA3AF',
    caution: isDark ? '#6B7280' : '#4B5563',
    danger: isDark ? '#1F2937' : '#111827',
    spending: isDark ? '#6B7280' : '#111827',
  }), [isDark]);

  // Utilization Rate Chart Data
  const utilizationChartData = useMemo(() => ({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Safe',
        data: [100, 120, 140, 150, 160, 180, 200, 220, 240, 260, 280, 300],
        borderColor: themeColors.safe,
        backgroundColor: 'transparent',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: 'Caution',
        data: [80, 100, 120, 130, 140, 150, 160, 180, 200, 220, 240, 260],
        borderColor: themeColors.caution,
        backgroundColor: 'transparent',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
      },
      {
        label: 'Danger',
        data: [60, 80, 100, 110, 120, 130, 140, 160, 180, 200, 220, 240],
        borderColor: themeColors.danger,
        backgroundColor: 'transparent',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  }), [themeColors]);

  const utilizationChartOptions: ChartOptions<'line'> = useMemo(() => ({
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
          color: themeColors.grid,
          drawTicks: false,
        },
        ticks: {
          color: themeColors.text,
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
          color: themeColors.grid,
          drawTicks: false,
        },
        ticks: {
          color: themeColors.text,
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
  }), [themeColors]);

  // Spending Patterns Chart Data
  const spendingChartData = useMemo(() => ({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Spending',
        data: [80, 120, 150, 180, 200, 170, 160, 200, 250, 300, 350, 400],
        borderColor: themeColors.spending,
        backgroundColor: 'transparent',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
        fill: false,
      },
    ],
  }), [themeColors]);

  const spendingChartOptions: ChartOptions<'line'> = useMemo(() => ({
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
          color: themeColors.grid,
          drawTicks: false,
        },
        ticks: {
          color: themeColors.text,
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
          color: themeColors.grid,
          drawTicks: false,
        },
        ticks: {
          color: themeColors.text,
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
  }), [themeColors]);

  // Chart legend configuration
  const utilizationLegend = useMemo(() => [
    { color: themeColors.safe, label: 'Safe' },
    { color: themeColors.caution, label: 'Caution' },
    { color: themeColors.danger, label: 'Danger' },
  ], [themeColors]);

  return (
    <div className="mx-auto">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-start md:justify-between">
        <div className="flex-1">
          <h1 className="mb-3 text-3xl font-bold text-brand md:text-4xl">
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
        <MetricCard
          label="Total Credit Available"
          value={`$${totalCreditAvailable.toLocaleString()}`}
          trend={{ value: '0.5% Increase', isPositive: true }}
          showInfo
        />

        <MetricCard
          label="Total Amount Owed"
          value={`$${totalAmountOwed.toLocaleString()}`}
          trend={{ value: '0.5% Increase', isPositive: true }}
          showInfo
        />

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
            <div className="flex flex-wrap items-center gap-4 sm:gap-0">
              {cardBalances.map((card, index) => (
                <div key={index} className="flex items-center">
                  {index > 0 && (
                    <div className="mx-4 hidden h-12 w-px bg-gray-200 dark:bg-gray-800 sm:block sm:mx-6 sm:h-16"></div>
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
      <ChartSection
        title="Overall Utilization Rate"
        primaryValue={`${creditUtilizationRate}%`}
        primaryLabel="Utilization percentage"
        trend={{ value: '0.5%' }}
        legend={utilizationLegend}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        periodOptions={['Yearly', 'Monthly', 'Last 3 months']}
      >
        <Line data={utilizationChartData} options={utilizationChartOptions} />
      </ChartSection>

      {/* Spending Patterns */}
      <ChartSection
        title="Spending Patterns"
        primaryValue="$400"
        primaryLabel="Average Amount"
        secondaryLabel="Spent"
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        periodOptions={['Yearly', 'Monthly']}
      >
        <Line data={spendingChartData} options={spendingChartOptions} />
      </ChartSection>

      {/* Payment History */}
      <PaymentHistoryTable data={paymentHistory} />

      {/* Recommended Actions */}
      <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 sm:mt-8 sm:p-6 lg:grid-cols-2 lg:gap-6">
        {/* Left side - Content */}
        <div>
          <h2 className="mb-2 text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
            Recommended Actions
          </h2>
          <p className="mb-4 text-xs text-gray-600 dark:text-gray-400 sm:mb-6 sm:text-sm">
            Here is what you need to do based on your credit analysis
          </p>

          <p className="mb-4 text-xs leading-relaxed text-gray-700 dark:text-gray-300 sm:mb-6 sm:text-sm">
            Suspendisse potenti. Ut molestie, risus vel egestas convallis, diam
            nisi posuere quam, ac egestas risus sapien sit amet lorem.
            Suspendisse non dignissim felis. In ac ligula sem. Donec suscipit
            sodales tempus. Ut vel metus arcu. Praesent sodales mi eget felis
            iaculis sagittis. Nunc condimentum luctus libero, et semper massa
            suscipit quis. Vestibulum ante ipsum primis in faucibus orci luctus
            et ultrices posuere cubilia curae; Nunc viverra vulputate justo.
          </p>

          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 sm:h-12 sm:w-12">
                <svg
                  className="h-5 w-5 text-white sm:h-6 sm:w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
                    Enable payment reminders
                  </h3>
                  <button className="text-xs text-gray-600 underline hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400">
                    Get Started
                  </button>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
                  Never miss a due date and protect your score effortlessly.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600 sm:h-12 sm:w-12">
                <svg
                  className="h-5 w-5 text-white sm:h-6 sm:w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
                    Set usage alerts
                  </h3>
                  <button className="text-xs text-gray-600 underline hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400">
                    Get Started
                  </button>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
                  Choose when Creduman warns you about high spending.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Placeholder/Image area */}
        <div className="hidden rounded-lg bg-gray-100 dark:bg-gray-900 lg:block">
          {/* This would be where an illustration or graphic goes */}
        </div>
      </div>
    </div>
  );
}
