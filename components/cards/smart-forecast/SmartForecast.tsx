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
import { Info, ChevronDown } from 'lucide-react';
import type { ConnectedCard, Transaction } from '@/types/card.types';
import { useCreditAnalysis } from '@/hooks/useCreditAnalysis';
import { useTheme } from '@/components/ThemeProvider';
import { inferTransactionCategory, formatCategoryLabel } from '@/lib/transactions/category-utils';
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

interface SpendingProbabilityPayload {
  probabilities: Array<{ category: string; probability: number }>;
  topCategory: string;
}

function toIsoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function isWithin(isoDate: string, startIso: string, endIso: string): boolean {
  return isoDate >= startIso && isoDate <= endIso;
}

function daysInMonth(year: number, monthOneIndexed: number): number {
  return new Date(year, monthOneIndexed, 0).getDate();
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function SmartForecast({ connectedCards }: SmartForecastProps) {
  const [showChartSettings, setShowChartSettings] = useState(false);
  const [transactionsByCard, setTransactionsByCard] = useState<Record<string, Transaction[]>>({});
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [spendingProbability, setSpendingProbability] = useState<SpendingProbabilityPayload | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
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

  useEffect(() => {
    let active = true;

    async function loadTransactions() {
      if (!connectedCards.length) {
        setTransactionsByCard({});
        return;
      }

      setTransactionsLoading(true);
      try {
        const entries = await Promise.all(
          connectedCards.map(async (card) => {
            const response = await fetch(`/api/cards/${card.id}/transactions?limit=200`, {
              method: 'GET',
              credentials: 'include',
            });

            if (!response.ok) {
              return [card.id, [] as Transaction[]] as const;
            }

            const payload = await response.json();
            const transactions = (payload?.data?.transactions ?? []) as Transaction[];
            return [card.id, transactions] as const;
          }),
        );

        if (!active) return;

        const map: Record<string, Transaction[]> = {};
        for (const [cardId, transactions] of entries) {
          map[cardId] = transactions;
        }

        setTransactionsByCard(map);
      } catch {
        if (!active) return;
        setTransactionsByCard({});
      } finally {
        if (!active) return;
        setTransactionsLoading(false);
      }
    }

    loadTransactions();

    return () => {
      active = false;
    };
  }, [connectedCards]);

  const scopedCardIds = useMemo(() => {
    if (viewMode === 'individual') return selectedCardId ? [selectedCardId] : [];
    if (viewMode === 'compare') return Array.from(compareCardIds);
    return connectedCards.map((card) => card.id);
  }, [viewMode, selectedCardId, compareCardIds, connectedCards]);

  const scopedTransactions = useMemo(() => {
    return scopedCardIds.flatMap((cardId) => transactionsByCard[cardId] ?? []);
  }, [scopedCardIds, transactionsByCard]);

  const categoryInsights = useMemo(() => {
    if (!scopedTransactions.length) {
      return {
        topFiveThisMonth: [] as Array<{ category: string; amount: number }>,
        anomaly: null as null | {
          category: string;
          averageMonthly: number;
          monthToDate: number;
          dayOfMonth: number;
        },
      };
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const monthIso = `${year}-${String(month).padStart(2, '0')}`;
    const monthStartIso = `${monthIso}-01`;
    const todayIso = toIsoDate(now);
    const dayOfMonth = now.getDate();
    const monthDays = daysInMonth(year, month);

    const thisMonthTotals = new Map<string, number>();
    const perMonthCategoryTotals = new Map<string, Map<string, number>>();

    for (const txn of scopedTransactions) {
      if (!txn.date || txn.amount <= 0) continue;
      const date = txn.date.slice(0, 10);
      const ym = date.slice(0, 7);
      const category = inferTransactionCategory(txn.category, txn.description, txn.merchantName);

      if (isWithin(date, monthStartIso, todayIso)) {
        thisMonthTotals.set(category, (thisMonthTotals.get(category) || 0) + txn.amount);
      }

      if (!perMonthCategoryTotals.has(ym)) {
        perMonthCategoryTotals.set(ym, new Map<string, number>());
      }
      const monthMap = perMonthCategoryTotals.get(ym)!;
      monthMap.set(category, (monthMap.get(category) || 0) + txn.amount);
    }

    const topFiveThisMonth = Array.from(thisMonthTotals.entries())
      .map(([category, amount]) => ({ category, amount: Number(amount.toFixed(2)) }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    const fullPastMonths = Array.from(perMonthCategoryTotals.keys())
      .filter((ym) => ym < monthIso)
      .sort()
      .slice(-3);

    let anomaly: { category: string; averageMonthly: number; monthToDate: number; dayOfMonth: number } | null = null;

    if (fullPastMonths.length > 0) {
      for (const [category, monthToDate] of thisMonthTotals.entries()) {
        const pastValues = fullPastMonths.map((ym) => perMonthCategoryTotals.get(ym)?.get(category) || 0);
        const averageMonthly = pastValues.reduce((sum, value) => sum + value, 0) / fullPastMonths.length;

        if (averageMonthly <= 0) continue;

        const alreadyOverUsual = monthToDate > averageMonthly;
        const pctOfMonth = dayOfMonth / monthDays;
        const paceProjection = monthToDate / Math.max(pctOfMonth, 0.1);
        const projectedOvershoot = paceProjection > averageMonthly * 1.1;

        if (alreadyOverUsual || projectedOvershoot) {
          if (!anomaly || (monthToDate - averageMonthly) > (anomaly.monthToDate - anomaly.averageMonthly)) {
            anomaly = {
              category,
              averageMonthly: Number(averageMonthly.toFixed(2)),
              monthToDate: Number(monthToDate.toFixed(2)),
              dayOfMonth,
            };
          }
        }
      }
    }

    return { topFiveThisMonth, anomaly };
  }, [scopedTransactions]);

  useEffect(() => {
    let active = true;

    const runAiSignals = async () => {
      if (!categoryInsights.topFiveThisMonth.length) {
        setSpendingProbability(null);
        return;
      }

      const topCategory = categoryInsights.topFiveThisMonth[0];
      if (!topCategory) return;

      setAiLoading(true);

      const probabilityResult = await apiPost<SpendingProbabilityPayload>('/api/credit-intelligence/spending-probability', {
        lookbackDays: 180,
        currentCategory: topCategory.category,
        cardId: viewMode === 'individual' ? selectedCardId : undefined,
      });

      if (!active) return;
      setSpendingProbability(probabilityResult);
      setAiLoading(false);
    };

    runAiSignals();

    return () => {
      active = false;
    };
  }, [categoryInsights.topFiveThisMonth, selectedCardId, viewMode]);

  if (loading) {
    return <SmartForecastSkeleton />;
  }

  const topSpendingCategory = categoryInsights.topFiveThisMonth[0];
  const probabilityLabel = spendingProbability?.topCategory
    ? formatCategoryLabel(spendingProbability.topCategory)
    : topSpendingCategory
      ? formatCategoryLabel(topSpendingCategory.category)
      : 'N/A';

  const overspendNarrative = categoryInsights.anomaly
    ? `Your normal spend for ${formatCategoryLabel(categoryInsights.anomaly.category)} is about ${formatCurrency(categoryInsights.anomaly.averageMonthly)}/month. It's day ${categoryInsights.anomaly.dayOfMonth} and you're already at ${formatCurrency(categoryInsights.anomaly.monthToDate)}. Might be time to slow down.`
    : 'No early-month overspend anomaly detected right now. Spending pace looks controlled.';

  const spendingPieData = {
    labels: categoryInsights.topFiveThisMonth.map((item) => formatCategoryLabel(item.category)),
    datasets: [
      {
        data: categoryInsights.topFiveThisMonth.map((item) => item.amount),
        backgroundColor: palette.slice(0, Math.max(categoryInsights.topFiveThisMonth.length, 1)),
        borderWidth: 1,
        borderColor: isDark ? '#111827' : '#ffffff',
      },
    ],
  };

  const spendingProbabilityBarData = {
    labels: (spendingProbability?.probabilities ?? []).slice(0, 6).map((item) => formatCategoryLabel(item.category)),
    datasets: [
      {
        label: 'Likelihood of next spend',
        data: (spendingProbability?.probabilities ?? []).slice(0, 6).map((item) => Number((item.probability * 100).toFixed(1))),
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

        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
          <p>
            Here are your top 5 spending categories for this month. Most likely next spend: {probabilityLabel}. {overspendNarrative}
          </p>
        </div>

        {transactionsLoading ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="h-64 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-900 sm:h-80" />
            <div className="h-64 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-900 sm:h-80" />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
              <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">Top 5 Categories This Month</p>
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
                    },
                  }}
                />
              </div>
            </div>
            <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
              <p className="mb-3 text-sm font-medium text-gray-700 dark:text-gray-300">AI Next Spend Likelihood</p>
              <div className="h-64 sm:h-80">
                <Bar
                  key={`spending-probability-bar-${resolvedTheme}-${viewMode}`}
                  data={spendingProbabilityBarData}
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
                          callback: (value: number | string) => `${value}%`,
                        },
                        grid: { color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {aiLoading && (
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">Refreshing intelligence signals...</p>
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
