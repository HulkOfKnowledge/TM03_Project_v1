/**
 * Credit Analysis Component
 * Consolidated view of all credit card information
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { useTheme } from '@/components/ThemeProvider';
import { cardService } from '@/services/card.service';
import type { CreditAnalysisData, ConnectedCard } from '@/types/card.types';
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
  connectedCards: ConnectedCard[];
}

export function CreditAnalysis({ connectedCards }: CreditAnalysisProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('Yearly');
  const [analysisData, setAnalysisData] = useState<CreditAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // Fetch credit analysis data on mount and when cards change
  useEffect(() => {
    loadAnalysisData();
  }, [connectedCards]);

  const loadAnalysisData = async () => {
    try {
      setLoading(true);
      const data = await cardService.getCreditAnalysisData();
      setAnalysisData(data);
    } catch (error) {
      console.error('Error loading credit analysis:', error);
    } finally {
      setLoading(false);
    }
  };

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
  const utilizationChartData = useMemo(() => {
    if (!analysisData) {
      return {
        labels: [],
        datasets: [],
      };
    }

    const labels = analysisData.utilizationChartData.map(d => d.label);
    const safeData = analysisData.utilizationChartData.map(d => d.value);
    const cautionData = analysisData.utilizationChartData.map(d => d.value * 0.8);
    const dangerData = analysisData.utilizationChartData.map(d => d.value * 0.6);

    return {
      labels,
      datasets: [
        {
          label: 'Safe',
          data: safeData,
          borderColor: themeColors.safe,
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 0,
        },
        {
          label: 'Caution',
          data: cautionData,
          borderColor: themeColors.caution,
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 0,
        },
        {
          label: 'Danger',
          data: dangerData,
          borderColor: themeColors.danger,
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 0,
        },
      ],
    };
  }, [analysisData, themeColors]);

  const utilizationChartOptions: ChartOptions<'line'> = useMemo(() => {
    // Calculate dynamic max based on data
    const maxValue = analysisData 
      ? Math.max(...analysisData.utilizationChartData.map(d => d.value))
      : 100;
    const yMax = Math.ceil(maxValue * 1.2 / 1000) * 1000; // Round up to nearest 1000 with 20% padding
    
    return {
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
          callbacks: {
            label: function(context) {
              return context.dataset.label + ': $' + context.parsed.y.toLocaleString();
            }
          }
        },
      },
      scales: {
        x: {
          grid: {
            display: false, // Hide vertical grid lines
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
          max: yMax || 5000,
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
              return '$' + (Number(value) / 1000).toFixed(0) + 'k';
            },
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
  }, [themeColors, analysisData]);

  // Spending Patterns Chart Data
  const spendingChartData = useMemo(() => {
    if (!analysisData) {
      return {
        labels: [],
        datasets: [],
      };
    }

    const labels = analysisData.spendingChartData.map(d => d.label);
    const data = analysisData.spendingChartData.map(d => d.value);

    return {
      labels,
      datasets: [
        {
          label: 'Spending',
          data,
          borderColor: themeColors.spending,
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 0,
          fill: false,
        },
      ],
    };
  }, [analysisData, themeColors]);

  const spendingChartOptions: ChartOptions<'line'> = useMemo(() => {
    // Calculate dynamic max based on data
    const maxValue = analysisData 
      ? Math.max(...analysisData.spendingChartData.map(d => d.value))
      : 100;
    const yMax = Math.ceil(maxValue * 1.2 / 1000) * 1000; // Round up to nearest 1000 with 20% padding
    
    return {
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
          callbacks: {
            label: function(context) {
              return 'Spending: $' + context.parsed.y.toLocaleString();
            }
          }
        },
      },
      scales: {
        x: {
          grid: {
            display: false, // Hide vertical grid lines
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
          max: yMax || 5000,
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
              return '$' + (Number(value) / 1000).toFixed(0) + 'k';
            },
          },
          border: {
            display: false,
          },
        },
      },
    };
  }, [themeColors, analysisData]);

  // Chart legend configuration
  const utilizationLegend = useMemo(() => [
    { color: themeColors.safe, label: 'Safe' },
    { color: themeColors.caution, label: 'Caution' },
    { color: themeColors.danger, label: 'Danger' },
  ], [themeColors]);

  // Show loading skeleton
  if (loading || !analysisData) {
    return (
      <div className="mx-auto">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <h1 className="mb-3 text-3xl font-bold text-brand md:text-4xl">
              Credit Analysis
            </h1>
            <p className="text-base text-gray-600 dark:text-gray-400">
              Understand your card breakdowns at a glance
            </p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

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
          value={`$${analysisData.totalCreditAvailable.toLocaleString()}`}
          trend={{ value: '0.5% Increase', isPositive: true }}
          showInfo
        />

        <MetricCard
          label="Total Amount Owed"
          value={`$${analysisData.totalAmountOwed.toLocaleString()}`}
          trend={{ value: '0.5% Increase', isPositive: true }}
          showInfo
        />

        {/* Bottom Row - Full Width Card with Split Layout */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 sm:p-6 lg:col-span-2">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Left side - Title and description */}
            <div className="flex-shrink-0">
              <span className="mb-2 block text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
                Data per card
              </span>
              <p className="mb-2 text-3xl text-gray-900 dark:text-white sm:text-4xl md:text-5xl">
                {connectedCards.length} Cards
              </p>
              <p className="inline-block rounded bg-gray-50 px-3 py-1.5 text-[10px] text-gray-500 dark:bg-gray-900 dark:text-gray-500 sm:text-xs">
                This is based on your connected cards. Connect more to see a detailed breakdown.
              </p>
            </div>

            {/* Right side - Card balances with dividers */}
            <div className="flex flex-wrap items-center gap-4 sm:gap-0">
              {analysisData.cardBalances.map((card, index) => (
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
        primaryValue={`${analysisData.creditUtilizationRate}%`}
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
        primaryValue={`$${analysisData.averageSpending}`}
        primaryLabel="Average Amount"
        secondaryLabel="Spent"
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        periodOptions={['Yearly', 'Monthly']}
      >
        <Line data={spendingChartData} options={spendingChartOptions} />
      </ChartSection>

      {/* Payment History */}
      <PaymentHistoryTable data={analysisData.paymentHistory} />

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
