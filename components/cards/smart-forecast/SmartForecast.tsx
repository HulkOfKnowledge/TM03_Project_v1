'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useMemo, useState, useEffect } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import { Info, ChevronDown, Sparkles, History, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { ConnectedCard } from '@/types/card.types';
import { useCreditAnalysis } from '@/hooks/useCreditAnalysis';
import { useTheme } from '@/components/ThemeProvider';
import { formatCategoryLabel } from '@/lib/transactions/category-utils';
import { ChartSettingsModal } from '@/components/cards/analysis/ChartSettingsModal';
import { SmartForecastSkeleton } from './SmartForecastSkeleton';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);

interface SmartForecastProps {
  connectedCards: ConnectedCard[];
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
}

interface ForecastSnapshot {
  mtdSpend: number;
  projectedMonthEnd: number;
  projectedLow: number;
  projectedHigh: number;
  confidence: 'High' | 'Medium' | 'Low';
  status: 'On Track' | 'Watch' | 'Risk';
  dayOfMonth: number;
  monthDays: number;
}

interface ForecastInsightsPayload {
  topCategories: Array<{ category: string; amount: number }>;
  anomaly: null | {
    category: string;
    averageMonthly: number;
    monthToDate: number;
    dayOfMonth: number;
    baselineMonths: string[];
  };
  categoryMomentum: Array<{
    category: string;
    currentAmount: number;
    previousAmount: number;
    changePct: number;
    direction: 'Rising' | 'Stable' | 'Cooling';
  }>;
  monthlyTrend: Array<{ month: string; total: number }>;
  forecastSnapshot: ForecastSnapshot | null;
  nextSpendPrediction: {
    currentCategory: string;
    topCategory: string;
    probabilities: Array<{ category: string; probability: number }>;
  } | null;
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function formatShortDate(iso: string): string {
  const d = parseIsoDate(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateRange(startIso: string, endIso: string): string {
  const start = parseIsoDate(startIso);
  const end = parseIsoDate(endIso);
  const sameMonth = start.getFullYear() === end.getFullYear() && start.getMonth() === end.getMonth();

  if (sameMonth) {
    const month = start.toLocaleDateString('en-US', { month: 'short' });
    return `${month} ${start.getDate()}-${end.getDate()}`;
  }

  return `${formatShortDate(startIso)}-${formatShortDate(endIso)}`;
}

function getMomentumDisplayLabel(direction: 'Rising' | 'Stable' | 'Cooling'): string {
  if (direction === 'Rising') return 'Spending More';
  if (direction === 'Cooling') return 'Spending Less';
  return 'About Same';
}

function getMomentumPlainLanguage(changePct: number, direction: 'Rising' | 'Stable' | 'Cooling'): string {
  if (direction === 'Rising') {
    return `You are spending ${Math.abs(changePct).toFixed(1)}% more than the previous period.`;
  }
  if (direction === 'Cooling') {
    return `You are spending ${Math.abs(changePct).toFixed(1)}% less than the previous period.`;
  }
  return 'Your spending is close to the previous period.';
}

export function SmartForecast({ connectedCards }: SmartForecastProps) {
  const [showChartSettings, setShowChartSettings] = useState(false);
  const [forecastInsights, setForecastInsights] = useState<ForecastInsightsPayload | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const {
    filterType, setFilterType,
    selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear,
    startDate, setStartDate,
    endDate, setEndDate,
    today,
    dateFilter,
    viewMode, setViewMode,
    selectedCardId, setSelectedCardId,
    compareCardIds, setCompareCardIds,
    palette,
    loading,
  } = useCreditAnalysis(connectedCards);

  const apiPost = async <T,>(url: string, payload: Record<string, unknown>): Promise<T | null> => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as ApiEnvelope<T>;
      if (!response.ok || !result.success || !result.data) return null;
      return result.data;
    } catch {
      return null;
    }
  };

  const handleCompareToggle = (cardId: string) => {
    setCompareCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        if (next.size > 1) next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  const isHistoricalRange = useMemo(() => {
    return dateFilter.endDate < today;
  }, [dateFilter.endDate, today]);

  useEffect(() => {
    let active = true;

    const loadForecastInsights = async () => {
      if (!connectedCards.length) {
        setForecastInsights(null);
        return;
      }

      setInsightsLoading(true);

      const cardScope =
        viewMode === 'individual'
          ? (selectedCardId ? [selectedCardId] : [])
          : viewMode === 'compare'
            ? Array.from(compareCardIds)
            : [];

      const result = await apiPost<ForecastInsightsPayload>('/api/credit-intelligence/forecast-insights', {
        startDate: dateFilter.startDate,
        endDate: dateFilter.endDate,
        cardId: viewMode === 'individual' ? selectedCardId : undefined,
        cardIds: viewMode === 'compare' ? cardScope : undefined,
      });

      if (!active) return;
      setForecastInsights(result);
      setInsightsLoading(false);
    };

    loadForecastInsights();

    return () => {
      active = false;
    };
  }, [connectedCards, viewMode, selectedCardId, compareCardIds, dateFilter.startDate, dateFilter.endDate]);

  const historicalMonthlyBarData = useMemo(() => {
    const entries = (forecastInsights?.monthlyTrend ?? []).slice(-8);

    const labels = entries.map(({ month }) => {
      const ym = month.slice(0, 7);
      const [y, m] = ym.split('-').map(Number);
      return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    });

    const data = entries.map(({ total }) => Number(total.toFixed(2)));

    return {
      labels,
      datasets: [
        {
          label: 'Monthly spend',
          data,
          backgroundColor: isDark ? 'rgba(20, 184, 166, 0.85)' : 'rgba(13, 148, 136, 0.85)',
          borderRadius: 8,
        },
      ],
    };
  }, [forecastInsights, isDark]);

  const momentumPeriods = useMemo(() => {
    const currentStart = dateFilter.startDate;
    const currentEnd = dateFilter.endDate;

    const todayDate = parseIsoDate(today);
    const currentStartDate = parseIsoDate(currentStart);
    const currentEndDate = parseIsoDate(currentEnd);

    const isCurrentMtd =
      currentStartDate.getDate() === 1
      && currentEnd === today
      && currentStartDate.getFullYear() === todayDate.getFullYear()
      && currentStartDate.getMonth() === todayDate.getMonth();

    if (isCurrentMtd) {
      const prevMonth = todayDate.getMonth() === 0 ? 11 : todayDate.getMonth() - 1;
      const prevYear = todayDate.getMonth() === 0 ? todayDate.getFullYear() - 1 : todayDate.getFullYear();
      const prevMonthDays = new Date(prevYear, prevMonth + 1, 0).getDate();
      const prevEndDay = Math.min(todayDate.getDate(), prevMonthDays);

      const prevStartIso = toIsoDate(new Date(prevYear, prevMonth, 1));
      const prevEndIso = toIsoDate(new Date(prevYear, prevMonth, prevEndDay));

      return {
        currentRangeLabel: formatDateRange(currentStart, currentEnd),
        compareRangeLabel: formatDateRange(prevStartIso, prevEndIso),
      };
    }

    const periodDays = Math.max(
      Math.floor((currentEndDate.getTime() - currentStartDate.getTime()) / (24 * 60 * 60 * 1000)) + 1,
      1,
    );
    const prevEndDate = new Date(currentStartDate.getTime() - 24 * 60 * 60 * 1000);
    const prevStartDate = new Date(prevEndDate.getTime() - (periodDays - 1) * 24 * 60 * 60 * 1000);

    return {
      currentRangeLabel: formatDateRange(currentStart, currentEnd),
      compareRangeLabel: formatDateRange(toIsoDate(prevStartDate), toIsoDate(prevEndDate)),
    };
  }, [dateFilter.startDate, dateFilter.endDate, today]);

  const showPredictionView = !isHistoricalRange;
  const forecastSnapshot: ForecastSnapshot | null = forecastInsights?.forecastSnapshot ?? null;

  if (loading) {
    return <SmartForecastSkeleton />;
  }

  const topCategories = forecastInsights?.topCategories ?? [];
  const anomaly = forecastInsights?.anomaly ?? null;
  const categoryMomentum = forecastInsights?.categoryMomentum ?? [];
  const nextSpendPrediction = forecastInsights?.nextSpendPrediction ?? null;
  const topSpendingCategory = topCategories[0];
  const totalFilteredSpend = topCategories.reduce((sum, item) => sum + item.amount, 0);
  const probabilityLabel = nextSpendPrediction?.topCategory
    ? formatCategoryLabel(nextSpendPrediction.topCategory)
    : topSpendingCategory
      ? formatCategoryLabel(topSpendingCategory.category)
      : 'N/A';

  const overspendSummary = anomaly
    ? `${formatCategoryLabel(anomaly.category)} spending is running higher than usual this month.`
    : 'Your spending pace looks normal.';

  const baselineSummary = anomaly
    ? `Usual monthly spend: ${formatCurrency(anomaly.averageMonthly)}. Current month so far: ${formatCurrency(anomaly.monthToDate)}.`
    : showPredictionView
      ? 'Pace alerts compare this month against your recent monthly average.'
      : 'Pace alerts are shown only for current month-to-date views.';

  const spendingPieData = {
    labels: topCategories.map((item) => formatCategoryLabel(item.category)),
    datasets: [
      {
        data: topCategories.map((item) => item.amount),
        backgroundColor: palette.slice(0, Math.max(topCategories.length, 1)),
        borderWidth: 1,
        borderColor: isDark ? '#111827' : '#ffffff',
      },
    ],
  };

  const spendingProbabilityBarData = {
    labels: (nextSpendPrediction?.probabilities ?? []).slice(0, 6).map((item) => formatCategoryLabel(item.category)),
    datasets: [
      {
        label: 'Likelihood of next spend',
        data: (nextSpendPrediction?.probabilities ?? []).slice(0, 6).map((item) => Number((item.probability * 100).toFixed(1))),
        backgroundColor: isDark ? 'rgba(99, 102, 241, 0.85)' : 'rgba(79, 70, 229, 0.85)',
        borderRadius: 8,
      },
    ],
  };

  return (
    <div className="mx-auto">
      <div className="mb-6 sm:mb-8">
        <div className="mb-3 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h1 className="mb-1.5 text-2xl font-bold text-brand sm:text-3xl md:text-4xl">Smart Forecast</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 sm:text-base">
              Spending intelligence powered by your current behavior and credit-intelligence signals.
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowChartSettings(true)}
          className="inline-flex max-w-full items-center gap-2 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700 transition-all hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:hover:bg-indigo-900/30 sm:text-sm"
        >
          <Info className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">Data for {dateFilter.label}</span>
          <span className="text-indigo-300 dark:text-indigo-600">·</span>
          <span className="whitespace-nowrap">
            {viewMode === 'consolidated' ? 'All Cards' : viewMode === 'individual' ? 'Individual' : 'Compare'}
          </span>
          <ChevronDown className="h-3.5 w-3.5 flex-shrink-0 text-indigo-400 dark:text-indigo-500" />
        </button>
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 sm:mb-8 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-base text-gray-700 dark:text-gray-300 sm:text-lg">Spending Intelligence</h2>
        </div>
        <div className="mb-4 h-px w-full bg-gray-200 dark:bg-gray-800"></div>

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                <Sparkles className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-wide">Month Outlook</p>
              </div>
              {forecastSnapshot && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    forecastSnapshot.status === 'Risk'
                      ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                      : forecastSnapshot.status === 'Watch'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                        : 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400'
                  }`}
                >
                  {forecastSnapshot.status}
                </span>
              )}
            </div>
            {forecastSnapshot ? (
              <>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                  Day {forecastSnapshot.dayOfMonth}/{forecastSnapshot.monthDays}: <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(forecastSnapshot.mtdSpend)}</span> spent.
                </p>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                  Projected month-end: <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(forecastSnapshot.projectedMonthEnd)}</span>.
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Range: {formatCurrency(forecastSnapshot.projectedLow)} to {formatCurrency(forecastSnapshot.projectedHigh)} • Confidence: {forecastSnapshot.confidence}
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                Projection appears when viewing current month-to-date.
              </p>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
              <History className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-wide">Smart Read</p>
            </div>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
              {showPredictionView
                ? `Most likely next spend: ${probabilityLabel}.`
                : 'Viewing past data: this section shows historical monthly trend instead of prediction.'}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Top category now: {topSpendingCategory ? formatCategoryLabel(topSpendingCategory.category) : 'N/A'}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
              <AlertTriangle className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-wide">Pace Check</p>
            </div>
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{overspendSummary}</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{baselineSummary}</p>
          </div>
        </div>

        {insightsLoading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="h-64 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-900 sm:h-80" />
            <div className="h-64 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-900 sm:h-80" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
              <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Top 5 Categories In Selected Period</p>
              <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Total in selected period: {formatCurrency(totalFilteredSpend)}</p>
              <div className="h-64 sm:h-80">
                <Pie
                  key={`spending-pie-${resolvedTheme}-${viewMode}`}
                  data={spendingPieData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: { color: isDark ? '#9CA3AF' : '#6B7280' },
                      },
                      tooltip: {
                        callbacks: {
                          label: (context: { label: string; parsed: number; dataset: { data: number[] } }) => {
                            const value = Number(context.parsed ?? 0);
                            const values = Array.isArray(context.dataset?.data) ? context.dataset.data : [];
                            const total = values.reduce((sum, item) => sum + Number(item || 0), 0);
                            const percentage = total > 0 ? (value / total) * 100 : 0;
                            return `${context.label}: ${formatCurrency(value)} (${percentage.toFixed(1)}%)`;
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
              <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                {showPredictionView ? 'Likely Next Spend (Ranked)' : 'Historical Monthly Spend Trend'}
              </p>
              <div className="h-64 sm:h-80">
                {showPredictionView ? (
                  <Bar
                    key={`spending-probability-bar-${resolvedTheme}-${viewMode}`}
                    data={spendingProbabilityBarData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      indexAxis: 'y',
                      scales: {
                        x: {
                          min: 0,
                          max: 100,
                          ticks: {
                            color: isDark ? '#9CA3AF' : '#6B7280',
                            callback: (value: number | string) => `${value}%`,
                          },
                          grid: { color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
                        },
                        y: {
                          ticks: {
                            color: isDark ? '#9CA3AF' : '#6B7280',
                          },
                          grid: { display: false },
                        },
                      },
                    }}
                  />
                ) : (
                  <Bar
                    key={`spending-history-bar-${resolvedTheme}-${viewMode}`}
                    data={historicalMonthlyBarData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: {
                          ticks: { color: isDark ? '#9CA3AF' : '#6B7280' },
                          grid: { display: false },
                        },
                        y: {
                          ticks: {
                            color: isDark ? '#9CA3AF' : '#6B7280',
                            callback: (value: number | string) => formatCurrency(Number(value)),
                          },
                          grid: { color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
                        },
                      },
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {showPredictionView && insightsLoading && (
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Refreshing intelligence signals...</p>
        )}
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 sm:mb-8 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h3 className="text-base text-gray-700 dark:text-gray-300 sm:text-lg">Category Momentum</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">{momentumPeriods.currentRangeLabel} vs {momentumPeriods.compareRangeLabel}</p>
        </div>
        <div className="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300">How to read this</p>
          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
            This compares {momentumPeriods.currentRangeLabel} with {momentumPeriods.compareRangeLabel}. “Spending More” means the category increased, “Spending Less” means it decreased, and “About Same” means little change.
          </p>
        </div>
        {categoryMomentum.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
            {categoryMomentum.slice(0, 6).map((item) => {
              const isRising = item.direction === 'Rising';
              const isCooling = item.direction === 'Cooling';
              const tone = isRising
                ? 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-950/30'
                : isCooling
                  ? 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-950/30'
                  : 'text-gray-700 bg-gray-100 dark:text-gray-300 dark:bg-gray-800';

              return (
                <div key={item.category} className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-gray-800 dark:text-gray-200">{formatCategoryLabel(item.category)}</p>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone}`}>
                      {isRising ? <TrendingUp className="h-3 w-3" /> : isCooling ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                      {getMomentumDisplayLabel(item.direction)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Now {formatCurrency(item.currentAmount)} • Before {formatCurrency(item.previousAmount)}
                  </p>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                    Change: {item.changePct >= 0 ? '+' : ''}{item.changePct.toFixed(1)}%
                  </p>
                  <p className="mt-1 text-xs text-gray-700 dark:text-gray-300">
                    {getMomentumPlainLanguage(item.changePct, item.direction)}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                    {momentumPeriods.currentRangeLabel} vs {momentumPeriods.compareRangeLabel}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">Not enough prior-period data to compute momentum yet.</p>
        )}
      </div>

      <ChartSettingsModal
        isOpen={showChartSettings}
        onClose={() => setShowChartSettings(false)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        selectedCardId={selectedCardId}
        onCardChange={setSelectedCardId}
        compareCardIds={compareCardIds}
        onCompareToggle={handleCompareToggle}
        connectedCards={connectedCards}
        palette={palette}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        today={today}
      />
    </div>
  );
}
