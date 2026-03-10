/**
 * useCreditAnalysis hook
 * Encapsulates all data fetching, state, and chart computation for the Credit Analysis view.
 * All metric calculations are performed server-side via GET /api/cards/metrics.
 */

import { useState, useMemo, useEffect } from 'react';
import type { ChartOptions } from 'chart.js';
import { useTheme } from '@/components/ThemeProvider';
import { cardService } from '@/services/card.service';
import { fetchCardMetrics } from '@/lib/api/cards-client';
import type { ConnectedCard, CreditAnalysisData, CardMetricsResponse } from '@/types/card.types';
import {
  getDatesInRange,
  fmtDayLabel,
  aggregateMonthly,
} from '@/lib/chart-utils';

export type ViewMode = 'consolidated' | 'individual' | 'compare';
export type FilterType = 'month' | 'range' | 'year';

export function useCreditAnalysis(connectedCards: ConnectedCard[]) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  // ── Date filter state ─────────────────────────────────────────────────────────
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0];

  const [filterType, setFilterType] = useState<FilterType>('range');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today);

  // Chart view mode state 
  const [viewMode, setViewMode] = useState<ViewMode>('consolidated');
  const [selectedCardId, setSelectedCardId] = useState(connectedCards[0]?.id ?? '');
  const [compareCardIds, setCompareCardIds] = useState<Set<string>>(
    () => new Set(connectedCards.slice(0, 2).map(c => c.id)),
  );

  // Data state
  const [metricsData, setMetricsData] = useState<CardMetricsResponse | null>(null);
  const [analysisData, setAnalysisData] = useState<CreditAnalysisData | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);

  const cardIdKey = connectedCards.map(c => c.id).join(',');

  useEffect(() => {
    let active = true;
    setLoadingAnalysis(true);
    cardService.getCreditAnalysisData().then(data => {
      if (!active) return;
      setAnalysisData(data);
      setLoadingAnalysis(false);
    });
    return () => { active = false; };
  }, [cardIdKey]); 

  // Derived date range 
  const dateFilter = useMemo(() => {
    const fmt = (d: string) => {
      const [y, mo, day] = d.split('-').map(Number);
      return new Date(y, mo - 1, day).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };
    if (filterType === 'month') {
      const [y, m] = selectedMonth.split('-').map(Number);
      const start = new Date(y, m - 1, 1).toISOString().split('T')[0];
      const end   = new Date(y, m, 0).toISOString().split('T')[0];
      return { startDate: start, endDate: end, label: new Date(y, m - 1, 1).toLocaleDateString('en-US', { year: 'numeric', month: 'long' }) };
    }
    if (filterType === 'year') {
      return { startDate: `${selectedYear}-01-01`, endDate: `${selectedYear}-12-31`, label: selectedYear };
    }
    const s = startDate || today, e = endDate || today;
    return { startDate: s, endDate: e, label: `${fmt(s)} to ${fmt(e)}` };
  }, [filterType, selectedMonth, selectedYear, startDate, endDate, today]);

  const chartDates = useMemo(() => getDatesInRange(dateFilter.startDate, dateFilter.endDate), [dateFilter]);
  const useMonthly = chartDates.length > 60;

  // Fetch metrics from the single-source-of-truth backend endpoint (after dateFilter is declared)
  useEffect(() => {
    if (!connectedCards.length) { setLoadingMetrics(false); return; }
    let active = true;
    setLoadingMetrics(true);
    fetchCardMetrics(dateFilter.startDate, dateFilter.endDate).then(data => {
      if (!active) return;
      setMetricsData(data);
      setLoadingMetrics(false);
    });
    return () => { active = false; };
  }, [cardIdKey, dateFilter.startDate, dateFilter.endDate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Theme palette 
  const palette = useMemo(() => [
    isDark ? '#8B5CF6' : '#7C3AED',
    isDark ? '#10B981' : '#059669',
    isDark ? '#F59E0B' : '#D97706',
    isDark ? '#EF4444' : '#DC2626',
    isDark ? '#3B82F6' : '#2563EB',
    isDark ? '#EC4899' : '#DB2777',
    isDark ? '#14B8A6' : '#0D9488',
    isDark ? '#F97316' : '#EA580C',
    isDark ? '#6366F1' : '#4F46E5',
    isDark ? '#84CC16' : '#65A30D',
  ], [isDark]);

  const textColor = isDark ? '#9CA3AF' : '#6B7280';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  // Cards in scope per view mode
  const displayCards = useMemo(() => {
    if (viewMode === 'individual') return connectedCards.filter(c => c.id === selectedCardId);
    if (viewMode === 'compare')    return connectedCards.filter(c => compareCardIds.has(c.id));
    return connectedCards;
  }, [viewMode, connectedCards, selectedCardId, compareCardIds]);

  // Chart series helper
  function toPoints(daily: (number | null)[], mode: 'last' | 'sum') {
    if (useMonthly) return aggregateMonthly(chartDates, daily, mode);
    return { labels: chartDates.map(fmtDayLabel), data: daily };
  }

  // Utilization chart data (from API daily series)
  const utilizationChartData = useMemo(() => {
    if (!metricsData) return { labels: [] as string[], datasets: [] };
    const { utilization } = metricsData.daily;
    const pr = useMonthly ? 4 : (chartDates.length > 45 ? 0 : 3);

    if (viewMode === 'consolidated') {
      const { labels, data } = toPoints(utilization.combined, 'last');
      const color = palette[0];
      return { labels, datasets: [{ label: 'Combined Utilization', data, borderColor: color, backgroundColor: color + '25', borderWidth: 2, tension: 0.4, pointRadius: pr, pointHoverRadius: 5, fill: true }] };
    }

    if (!displayCards.length) return { labels: [] as string[], datasets: [] };
    const firstData = utilization.byCard[displayCards[0].id] ?? chartDates.map(() => null as number | null);
    const { labels } = toPoints(firstData, 'last');
    return {
      labels,
      datasets: displayCards.map((card, i) => {
        const rawData = utilization.byCard[card.id] ?? chartDates.map(() => null as number | null);
        const { data } = toPoints(rawData, 'last');
        const color = palette[i % palette.length];
        return { label: `${card.bank} ****${card.lastFour}`, data, borderColor: color, backgroundColor: 'transparent', borderWidth: 2, tension: 0.4, pointRadius: pr, pointHoverRadius: 5, fill: false };
      }),
    };
  }, [metricsData, viewMode, displayCards, chartDates, useMonthly, palette]); // eslint-disable-line react-hooks/exhaustive-deps

  // Spending chart data (from API daily series)
  const spendingChartData = useMemo(() => {
    if (!metricsData) return { labels: [] as string[], datasets: [] };
    const { spending } = metricsData.daily;
    const pr = useMonthly ? 4 : (chartDates.length > 45 ? 0 : 3);

    if (viewMode === 'consolidated') {
      const { labels, data } = toPoints(spending.combined, 'sum');
      const color = palette[1];
      return { labels, datasets: [{ label: 'Total Spending', data, borderColor: color, backgroundColor: color + '25', borderWidth: 2, tension: 0.4, pointRadius: pr, pointHoverRadius: 5, fill: true }] };
    }

    if (!displayCards.length) return { labels: [] as string[], datasets: [] };
    const firstData = spending.byCard[displayCards[0].id] ?? chartDates.map(() => 0);
    const { labels } = toPoints(firstData, 'sum');
    return {
      labels,
      datasets: displayCards.map((card, i) => {
        const rawData = spending.byCard[card.id] ?? chartDates.map(() => 0);
        const { data } = toPoints(rawData, 'sum');
        const color = palette[i % palette.length];
        return { label: `${card.bank} ****${card.lastFour}`, data, borderColor: color, backgroundColor: 'transparent', borderWidth: 2, tension: 0.4, pointRadius: pr, pointHoverRadius: 5, fill: false };
      }),
    };
  }, [metricsData, viewMode, displayCards, chartDates, useMonthly, palette, today]); // eslint-disable-line react-hooks/exhaustive-deps

  // Chart options
  const utilizationChartOptions: ChartOptions<'line'> = useMemo(() => ({
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom' as const, labels: { color: textColor, usePointStyle: true, padding: 15 } },
      tooltip: { enabled: true, mode: 'index' as const, intersect: false, callbacks: { label: ctx => `${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toFixed(1)}%` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: textColor, font: { size: 12 }, maxTicksLimit: 12 }, border: { display: false } },
      y: { min: 0, max: 100, grid: { color: gridColor, lineWidth: 0.5, drawTicks: false }, ticks: { color: textColor, font: { size: 12 }, callback: v => `${v}%`, stepSize: 10 }, border: { display: false } },
    },
    interaction: { mode: 'index' as const, intersect: false },
  }), [textColor, gridColor]);

  const spendingChartOptions: ChartOptions<'line'> = useMemo(() => {
    const allVals = spendingChartData.datasets.flatMap(d => d.data as number[]);
    const maxVal = Math.max(...allVals, 100);
    const yMax = Math.ceil(maxVal * 1.2 / 1000) * 1000;
    return {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: true, position: 'bottom' as const, labels: { color: textColor, usePointStyle: true, padding: 15 } },
        tooltip: { enabled: true, mode: 'index' as const, intersect: false, callbacks: { label: ctx => `${ctx.dataset.label}: $${(ctx.parsed.y ?? 0).toLocaleString()}` } },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: textColor, font: { size: 12 }, maxTicksLimit: 12 }, border: { display: false } },
        y: { min: 0, max: yMax || 5000, grid: { color: gridColor, lineWidth: 0.5, drawTicks: false }, ticks: { color: textColor, font: { size: 12 }, callback: v => `$${(Number(v) / 1000).toFixed(0)}k` }, border: { display: false } },
      },
    };
  }, [textColor, gridColor, spendingChartData]);

  // Previous-period label for trend badges (display-only string, no computation needed)
  const prevLabel = useMemo(() => {
    if (filterType === 'month') {
      const [y, m] = selectedMonth.split('-').map(Number);
      const pd = new Date(y, m - 2, 1);
      return pd.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    }
    if (filterType === 'year') return String(Number(selectedYear) - 1);
    return 'prev period';
  }, [filterType, selectedMonth, selectedYear]);

  // Chart-level metrics derived from the API response
  const chartMetrics = useMemo(() => {
    const defaults = { lastUtil: 0, utilDiff: 0, totalSpend: 0, spendTrendPct: 0, prevLabel };
    if (!metricsData) return defaults;

    let lastUtil: number;
    let prevLastUtil: number;
    let totalSpend: number;
    let prevSpend: number;

    if (viewMode === 'consolidated') {
      lastUtil     = metricsData.totals.totalUtilizationPct;
      prevLastUtil = metricsData.prevPeriod.totals.totalUtilizationPct;
      totalSpend   = metricsData.totals.totalSpending;
      prevSpend    = metricsData.prevPeriod.totals.totalSpending;
    } else {
      const displayIds = new Set(displayCards.map(c => c.id));
      const curCards  = metricsData.cards.filter(c => displayIds.has(c.id));
      const prevCards = metricsData.prevPeriod.cards.filter(c => displayIds.has(c.id));
      const totalLimit = displayCards.reduce((s, c) => s + (c.creditLimit || 0), 0);

      const totalBal  = curCards.reduce((s, c) => s + c.endingBalance, 0);
      const prevBal   = prevCards.reduce((s, c) => s + c.endingBalance, 0);
      lastUtil     = totalLimit > 0 ? +(totalBal / totalLimit * 100).toFixed(2)  : 0;
      prevLastUtil = totalLimit > 0 ? +(prevBal  / totalLimit * 100).toFixed(2)  : 0;
      totalSpend   = curCards.reduce((s, c) => s + c.totalSpending, 0);
      prevSpend    = prevCards.reduce((s, c) => s + c.totalSpending, 0);
    }

    const utilDiff      = lastUtil - prevLastUtil;
    const spendTrendPct = prevSpend > 0 ? +((totalSpend - prevSpend) / prevSpend * 100).toFixed(2) : 0;
    return { lastUtil, utilDiff, totalSpend, spendTrendPct, prevLabel };
  }, [metricsData, viewMode, displayCards, prevLabel]);

  // Metrics scoped to the current date filter  derived from the API response
  const filteredMetrics = useMemo(() => {
    if (!metricsData) return { totalOwed: 0, totalAvailable: 0, cardBalances: [], owedChangePct: 0, availableChangePct: 0 };

    const { totals, prevPeriod, cards } = metricsData;
    const owedChangePct = prevPeriod.totals.totalEndingBalance > 0
      ? +((totals.totalEndingBalance - prevPeriod.totals.totalEndingBalance) / prevPeriod.totals.totalEndingBalance * 100).toFixed(2)
      : 0;
    const availableChangePct = prevPeriod.totals.totalAvailable > 0
      ? +((totals.totalAvailable - prevPeriod.totals.totalAvailable) / prevPeriod.totals.totalAvailable * 100).toFixed(2)
      : 0;

    return {
      totalOwed: totals.totalEndingBalance,
      totalAvailable: totals.totalAvailable,
      cardBalances: cards.map(c => ({ name: `${c.bank} ****${c.lastFour}`, balance: c.endingBalance })),
      owedChangePct,
      availableChangePct,
    };
  }, [metricsData]);

  // Filtered payment history 
  const filteredPaymentHistory = useMemo(() => {
    if (!analysisData?.paymentHistory) return [];
    const yrStart = parseInt(dateFilter.startDate.slice(0, 4));
    const yrEnd   = parseInt(dateFilter.endDate.slice(0, 4));
    return analysisData.paymentHistory.filter(row => {
      const m = row.month.match(/\d{4}/);
      if (!m) return true;
      return parseInt(m[0]) >= yrStart && parseInt(m[0]) <= yrEnd;
    });
  }, [analysisData, dateFilter]);

  return {
    // date filter state
    filterType, setFilterType,
    selectedMonth, setSelectedMonth,
    selectedYear, setSelectedYear,
    startDate, setStartDate,
    endDate, setEndDate,
    today,
    dateFilter,
    // view mode state
    viewMode, setViewMode,
    selectedCardId, setSelectedCardId,
    compareCardIds, setCompareCardIds,
    palette,
    // loading
    loading: loadingMetrics || loadingAnalysis,
    // data
    analysisData,
    filteredMetrics,
    // chart
    utilizationChartData,
    utilizationChartOptions,
    spendingChartData,
    spendingChartOptions,
    chartMetrics,
    // computed
    filteredPaymentHistory,
  };
}
