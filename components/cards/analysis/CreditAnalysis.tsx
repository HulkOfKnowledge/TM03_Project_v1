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

  // Fetch credit analysis data once on mount and when cards change
  useEffect(() => {
    loadAnalysisData();
  }, [connectedCards.map(c => c.id).join(',')]);

  const loadAnalysisData = async () => {
    try {
      setLoading(true);
      // Fetch all data once - no period parameter
      const data = await cardService.getCreditAnalysisData();
      setAnalysisData(data);
    } catch (error) {
      console.error('Error loading credit analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on selected period (client-side)
  const filteredData = useMemo(() => {
    if (!analysisData) return null;

    const allMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let monthsToShow: string[];
    let historyLimit: number;

    if (selectedPeriod === 'This month') {
      const currentMonth = new Date().toLocaleDateString('en-US', { month: 'short' });
      monthsToShow = [currentMonth];
      historyLimit = 1;
    } else if (selectedPeriod === 'Last 3 months') {
      const currentMonthIndex = new Date().getMonth();
      monthsToShow = [
        allMonths[(currentMonthIndex - 2 + 12) % 12],
        allMonths[(currentMonthIndex - 1 + 12) % 12],
        allMonths[currentMonthIndex]
      ];
      historyLimit = 3;
    } else {
      // Yearly
      monthsToShow = allMonths;
      historyLimit = 12;
    }

    // Filter chart data to show only selected months
    const filteredUtilization = analysisData.utilizationChartData.map(card => ({
      ...card,
      data: card.data.filter(d => monthsToShow.includes(d.label)),
    }));

    const filteredSpending = analysisData.spendingChartData.map(card => ({
      ...card,
      data: card.data.filter(d => monthsToShow.includes(d.label)),
    }));

    // Filter payment history to show only recent entries
    const filteredPaymentHistory = analysisData.paymentHistory.slice(-historyLimit * connectedCards.length);

    return {
      ...analysisData,
      utilizationChartData: filteredUtilization,
      spendingChartData: filteredSpending,
      paymentHistory: filteredPaymentHistory,
    };
  }, [analysisData, selectedPeriod, connectedCards.length]);

  // Memoize theme-dependent values
  const themeColors = useMemo(() => ({
    text: isDark ? '#9CA3AF' : '#6B7280',
    grid: isDark ? '#374151' : '#E5E7EB',
    // Colors for different cards (up to 10 cards)
    cardColors: [
      isDark ? '#8B5CF6' : '#7C3AED', // Purple
      isDark ? '#10B981' : '#059669', // Green
      isDark ? '#F59E0B' : '#D97706', // Amber
      isDark ? '#EF4444' : '#DC2626', // Red
      isDark ? '#3B82F6' : '#2563EB', // Blue
      isDark ? '#EC4899' : '#DB2777', // Pink
      isDark ? '#14B8A6' : '#0D9488', // Teal
      isDark ? '#F97316' : '#EA580C', // Orange
      isDark ? '#6366F1' : '#4F46E5', // Indigo
      isDark ? '#84CC16' : '#65A30D', // Lime
    ],
  }), [isDark]);

  // Utilization Rate Chart Data - One line per card showing utilization %
  const utilizationChartData = useMemo(() => {
    if (!filteredData || !filteredData.utilizationChartData.length) {
      return {
        labels: [],
        datasets: [],
      };
    }

    const labels = filteredData.utilizationChartData[0].data.map(d => d.label);
    
    // Create a dataset for each card
    const datasets = filteredData.utilizationChartData.map((cardData, index) => ({
      label: cardData.cardName,
      data: cardData.data.map(d => d.value), // Utilization percentage
      borderColor: themeColors.cardColors[index % themeColors.cardColors.length],
      backgroundColor: 'transparent',
      borderWidth: 2,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 5,
    }));

    return {
      labels,
      datasets,
    };
  }, [filteredData, themeColors]);

  const utilizationChartOptions: ChartOptions<'line'> = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom' as const,
          labels: {
            color: themeColors.text,
            usePointStyle: true,
            padding: 15,
          },
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              const value = context.parsed.y ?? 0;
              return context.dataset.label + ': ' + value + '%';
            }
          }
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
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
          max: 100, // Percentage scale
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
              return value + '%';
            },
            stepSize: 10,
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
  }, [themeColors]);

  // Spending Patterns Chart Data - One line per card showing spending in dollars
  const spendingChartData = useMemo(() => {
    if (!filteredData || !filteredData.spendingChartData.length) {
      return {
        labels: [],
        datasets: [],
      };
    }

    const labels = filteredData.spendingChartData[0].data.map(d => d.label);
    
    // Create a dataset for each card
    const datasets = filteredData.spendingChartData.map((cardData, index) => ({
      label: cardData.cardName,
      data: cardData.data.map(d => d.value), // Dollar amounts
      borderColor: themeColors.cardColors[index % themeColors.cardColors.length],
      backgroundColor: 'transparent',
      borderWidth: 2,
      tension: 0.4,
      pointRadius: 3,
      pointHoverRadius: 5,
      fill: false,
    }));

    return {
      labels,
      datasets,
    };
  }, [filteredData, themeColors]);

  const spendingChartOptions: ChartOptions<'line'> = useMemo(() => {
    // Calculate dynamic max based on data
    const maxValue = filteredData && filteredData.spendingChartData.length
      ? Math.max(...filteredData.spendingChartData.flatMap(card => card.data.map(d => d.value)))
      : 5000;
    const yMax = Math.ceil(maxValue * 1.2 / 1000) * 1000; // Round up to nearest 1000 with 20% padding
    
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom' as const,
          labels: {
            color: themeColors.text,
            usePointStyle: true,
            padding: 15,
          },
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              const value = context.parsed.y ?? 0;
              return context.dataset.label + ': $' + value.toLocaleString();
            }
          }
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
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
  }, [themeColors, filteredData]);

  // Show loading skeleton
  if (loading || !analysisData || !filteredData) {
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
          value={`$${filteredData!.totalCreditAvailable.toLocaleString()}`}
          trend={{ value: '0.5% Increase', isPositive: true }}
          showInfo
        />

        <MetricCard
          label="Total Amount Owed"
          value={`$${filteredData!.totalAmountOwed.toLocaleString()}`}
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
              {filteredData!.cardBalances.map((card, index) => (
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
        primaryValue={`${filteredData!.creditUtilizationRate}%`}
        primaryLabel="Utilization percentage"
        trend={{ value: '0.5%' }}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        periodOptions={['This month', 'Yearly', 'Last 3 months']}
        valueClassName={filteredData!.creditUtilizationRate > 30 ? "text-4xl text-red-600 dark:text-red-500 sm:text-5xl" : "text-4xl text-gray-900 dark:text-white sm:text-5xl"}
      >
        <Line data={utilizationChartData} options={utilizationChartOptions} />
      </ChartSection>

      {/* Spending Patterns */}
      <ChartSection
        title="Spending Patterns"
        primaryValue={`$${filteredData!.averageSpending.toLocaleString()}`}
        primaryLabel="Average Amount"
        secondaryLabel="Spent"
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
        periodOptions={['This month', 'Yearly', 'Last 3 months']}
      >
        <Line data={spendingChartData} options={spendingChartOptions} />
      </ChartSection>

      {/* Payment History */}
      <PaymentHistoryTable data={filteredData!.paymentHistory} />


      {/* Recommended Actions */}
      <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 sm:mt-8 sm:p-6 lg:grid-cols-2 lg:gap-6">
        {/* Left side - Content */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="mb-2 text-lg font-bold text-gray-900 dark:text-white sm:text-xl">
                Recommended Actions
              </h2>
              <p className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
                Here is what you need to do based on your credit analysis
              </p>
            </div>
            {/* {filteredData!.mlInsights && (
              <div className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                Score: {filteredData!.mlInsights.overallScore}/100
              </div>
            )} */}
          </div>

          {filteredData!.mlInsights && filteredData!.mlInsights.insights && filteredData!.mlInsights.insights.length > 0 ? (
            <>
              <p className="mb-4 text-xs leading-relaxed text-gray-700 dark:text-gray-300 sm:mb-6 sm:text-sm">
                Our AI has analyzed your credit profile and identified {filteredData!.mlInsights.insights.length} key {filteredData!.mlInsights.insights.length === 1 ? 'action' : 'actions'} to help you improve your credit health and achieve your financial goals.
              </p>

              <div className="space-y-3 sm:space-y-4">
                {filteredData!.mlInsights.insights.map((insight: any, index: number) => {
                  // Icon based on type
                  const getTypeIcon = (type: string) => {
                    switch (type) {
                      case 'alert':
                        return (
                          <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        );
                      case 'achievement':
                        return (
                          <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        );
                      case 'tip':
                        return (
                          <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        );
                      default: // recommendation
                        return (
                          <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        );
                    }
                  };

                  const getPriorityColor = (priority: string) => {
                    switch (priority) {
                      case 'urgent':
                        return 'bg-red-600';
                      case 'high':
                        return 'bg-orange-600';
                      case 'medium':
                        return 'bg-yellow-600';
                      default:
                        return 'bg-indigo-600';
                    }
                  };

                  return (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${getPriorityColor(insight.priority)} sm:h-12 sm:w-12`}>
                        <span className="text-white">
                          {getTypeIcon(insight.type)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
                            {insight.title.en}
                          </h3>
                          {insight.action_required && (
                            <button className="text-xs text-red-600 underline hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                              Take Action
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
                          {insight.message.en}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <>
              <p className="mb-4 text-xs leading-relaxed text-gray-700 dark:text-gray-300 sm:mb-6 sm:text-sm">
                No AI insights available yet. Connect more cards and build your payment history to receive personalized recommendations based on your credit profile.
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
            </>
          )}
        </div>

        {/* Right side - Placeholder/Image area */}
        <div className="hidden rounded-lg bg-gray-100 dark:bg-gray-900 lg:block">
          {/* This would be where an illustration or graphic goes */}
        </div>
      </div>
    </div>
  );
}
