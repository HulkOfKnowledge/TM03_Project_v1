/**
 * useCreditAnalysis hook
 * Encapsulates all data fetching, state, and chart computation for the Credit Analysis view.
 */

import { useState, useMemo, useEffect } from 'react';
import type { ChartOptions } from 'chart.js';
import { useTheme } from '@/components/ThemeProvider';
import { cardService } from '@/services/card.service';
import type { Transaction, ConnectedCard, CreditAnalysisData } from '@/types/card.types';
import {
  getDatesInRange,
  fmtDayLabel,
  buildDailyUtilization,
  buildDailySpending,
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
  const [allTransactions, setAllTransactions] = useState<Map<string, Transaction[]>>(new Map());
  const [analysisData, setAnalysisData] = useState<CreditAnalysisData | null>(null);
  const [loadingTxns, setLoadingTxns] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(true);

  const cardIdKey = connectedCards.map(c => c.id).join(',');

  useEffect(() => {
    if (!connectedCards.length) { setLoadingTxns(false); return; }
    let active = true;
    setLoadingTxns(true);
    Promise.all(
      connectedCards.map(async card => {
        try {
          const raw = await cardService.getCardTransactions(card.id, 500);
          return { id: card.id, txns: cardService.calculateTransactionZones(raw, card) };
        } catch {
          return { id: card.id, txns: [] as Transaction[] };
        }
      }),
    ).then(results => {
      if (!active) return;
      const m = new Map<string, Transaction[]>();
      results.forEach(r => m.set(r.id, r.txns));
      setAllTransactions(m);
      setLoadingTxns(false);
    });
    return () => { active = false; };
  }, [cardIdKey]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const gridColor = isDark ? '#374151' : '#E5E7EB';

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

  // Utilization chart data
  const utilizationChartData = useMemo(() => {
    if (viewMode === 'consolidated') {
      const totalLimit = connectedCards.reduce((s, c) => s + (c.creditLimit || 0), 0);
      if (!totalLimit) return { labels: [] as string[], datasets: [] };
      const daily: (number | null)[] = chartDates.map(day => {
        if (day > today) return null;
        return Math.min(Math.max(
          connectedCards.reduce((sum, card) => {
            const sorted = [...(allTransactions.get(card.id) ?? [])].sort((a, b) => a.date.localeCompare(b.date));
            return sum + (sorted.filter(t => t.date <= day).pop()?.balance ?? 0);
          }, 0) / totalLimit * 100,
        0), 100);
      });
      const { labels, data } = toPoints(daily, 'last');
      const color = palette[0];
      const pr = useMonthly ? 4 : (chartDates.length > 45 ? 0 : 3);
      return { labels, datasets: [{ label: 'Combined Utilization', data, borderColor: color, backgroundColor: color + '25', borderWidth: 2, tension: 0.4, pointRadius: pr, pointHoverRadius: 5, fill: true }] };
    }
    if (!displayCards.length) return { labels: [] as string[], datasets: [] };
    const ref = toPoints(buildDailyUtilization(allTransactions.get(displayCards[0].id) ?? [], displayCards[0].creditLimit, chartDates, today), 'last');
    return {
      labels: ref.labels,
      datasets: displayCards.map((card, i) => {
        const { data } = toPoints(buildDailyUtilization(allTransactions.get(card.id) ?? [], card.creditLimit, chartDates, today), 'last');
        const color = palette[i % palette.length];
        const pr = useMonthly ? 4 : (chartDates.length > 45 ? 0 : 3);
        return { label: `${card.bank} ****${card.lastFour}`, data, borderColor: color, backgroundColor: 'transparent', borderWidth: 2, tension: 0.4, pointRadius: pr, pointHoverRadius: 5, fill: false };
      }),
    };
  }, [viewMode, displayCards, connectedCards, allTransactions, chartDates, useMonthly, palette]); // eslint-disable-line react-hooks/exhaustive-deps

  // Spending chart data
  const spendingChartData = useMemo(() => {
    if (viewMode === 'consolidated') {
      const allTxns = connectedCards.flatMap(c => allTransactions.get(c.id) ?? []);
      const { labels, data } = toPoints(buildDailySpending(allTxns, chartDates, today), 'sum');
      const color = palette[1];
      const pr = useMonthly ? 4 : (chartDates.length > 45 ? 0 : 3);
      return { labels, datasets: [{ label: 'Total Spending', data, borderColor: color, backgroundColor: color + '25', borderWidth: 2, tension: 0.4, pointRadius: pr, pointHoverRadius: 5, fill: true }] };
    }
    if (!displayCards.length) return { labels: [] as string[], datasets: [] };
    const ref = toPoints(buildDailySpending(allTransactions.get(displayCards[0].id) ?? [], chartDates, today), 'sum');
    return {
      labels: ref.labels,
      datasets: displayCards.map((card, i) => {
        const { data } = toPoints(buildDailySpending(allTransactions.get(card.id) ?? [], chartDates, today), 'sum');
        const color = palette[i % palette.length];
        const pr = useMonthly ? 4 : (chartDates.length > 45 ? 0 : 3);
        return { label: `${card.bank} ****${card.lastFour}`, data, borderColor: color, backgroundColor: 'transparent', borderWidth: 2, tension: 0.4, pointRadius: pr, pointHoverRadius: 5, fill: false };
      }),
    };
  }, [viewMode, displayCards, connectedCards, allTransactions, chartDates, useMonthly, palette, today]); // eslint-disable-line react-hooks/exhaustive-deps

  // Chart options
  const utilizationChartOptions: ChartOptions<'line'> = useMemo(() => ({
    responsive: true, maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'bottom' as const, labels: { color: textColor, usePointStyle: true, padding: 15 } },
      tooltip: { enabled: true, mode: 'index' as const, intersect: false, callbacks: { label: ctx => `${ctx.dataset.label}: ${(ctx.parsed.y ?? 0).toFixed(1)}%` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: textColor, font: { size: 12 }, maxTicksLimit: 12 }, border: { display: false } },
      y: { min: 0, max: 100, grid: { color: gridColor, drawTicks: false }, ticks: { color: textColor, font: { size: 12 }, callback: v => `${v}%`, stepSize: 10 }, border: { display: false } },
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
        y: { min: 0, max: yMax || 5000, grid: { color: gridColor, drawTicks: false }, ticks: { color: textColor, font: { size: 12 }, callback: v => `$${(Number(v) / 1000).toFixed(0)}k` }, border: { display: false } },
      },
    };
  }, [textColor, gridColor, spendingChartData]);

  // Previous period bounds 
  const prevDateFilter = useMemo(() => {
    if (filterType === 'month') {
      const [y, m] = selectedMonth.split('-').map(Number);
      const pd = new Date(y, m - 2, 1);
      const py = pd.getFullYear(), pm = pd.getMonth() + 1;
      const pms = String(pm).padStart(2, '0');
      return { startDate: `${py}-${pms}-01`, endDate: new Date(py, pm, 0).toISOString().split('T')[0] };
    }
    if (filterType === 'year') {
      const py = Number(selectedYear) - 1;
      return { startDate: `${py}-01-01`, endDate: `${py}-12-31` };
    }
    const s = new Date(dateFilter.startDate + 'T12:00:00');
    const e = new Date(dateFilter.endDate + 'T12:00:00');
    const durMs = e.getTime() - s.getTime() + 86400000;
    const prevE = new Date(s.getTime() - 86400000);
    const prevS = new Date(prevE.getTime() - durMs + 86400000);
    return { startDate: prevS.toISOString().split('T')[0], endDate: prevE.toISOString().split('T')[0] };
  }, [filterType, selectedMonth, selectedYear, dateFilter.startDate, dateFilter.endDate]);

  //  Chart-derived metrics
  const chartMetrics = useMemo(() => {
    const totalLimit = connectedCards.reduce((s, c) => s + (c.creditLimit || 0), 0);
    const curUtilData = (utilizationChartData.datasets[0]?.data ?? []) as (number | null)[];
    const lastNonNullUtil = [...curUtilData].reverse().find(v => v !== null);
    const lastUtil = lastNonNullUtil ?? 0;
    const prevEnd = prevDateFilter.endDate;
    let prevUtil = 0;
    if (viewMode === 'consolidated' && totalLimit) {
      prevUtil = Math.min(Math.max(
        connectedCards.reduce((sum, card) => {
          const sorted = [...(allTransactions.get(card.id) ?? [])].sort((a, b) => a.date.localeCompare(b.date));
          return sum + (sorted.filter(t => t.date <= prevEnd).pop()?.balance ?? 0);
        }, 0) / totalLimit * 100, 0), 100);
    } else if (displayCards.length && displayCards[0].creditLimit) {
      const sorted = [...(allTransactions.get(displayCards[0].id) ?? [])].sort((a, b) => a.date.localeCompare(b.date));
      const lb = sorted.filter(t => t.date <= prevEnd).pop()?.balance ?? 0;
      prevUtil = Math.min(Math.max(lb / displayCards[0].creditLimit * 100, 0), 100);
    }
    const utilDiff = lastUtil - prevUtil;
    const curSpendData = (spendingChartData.datasets[0]?.data ?? []) as (number | null)[];
    const totalSpend = curSpendData.reduce<number>((a, b) => a + (b ?? 0), 0);
    const prevDates = getDatesInRange(prevDateFilter.startDate, prevDateFilter.endDate);
    let prevSpend = 0;
    if (viewMode === 'consolidated') {
      const allTxns = connectedCards.flatMap(c => allTransactions.get(c.id) ?? []);
      prevSpend = buildDailySpending(allTxns, prevDates).reduce<number>((a, b) => a + (b ?? 0), 0);
    } else if (displayCards.length) {
      const txns = displayCards.flatMap(c => allTransactions.get(c.id) ?? []);
      prevSpend = buildDailySpending(txns, prevDates).reduce<number>((a, b) => a + (b ?? 0), 0);
    }
    const spendTrendPct = prevSpend > 0 ? ((totalSpend - prevSpend) / prevSpend * 100) : 0;
    // Label for the comparison period shown in trend badges
    const prevLabel = (() => {
      if (filterType === 'month') {
        const [y, m] = selectedMonth.split('-').map(Number);
        const pd = new Date(y, m - 2, 1);
        return pd.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      if (filterType === 'year') return String(Number(selectedYear) - 1);
      return 'prev period';
    })();
    return { lastUtil, utilDiff, totalSpend, spendTrendPct, prevLabel };
  }, [utilizationChartData, spendingChartData, viewMode, connectedCards, displayCards, allTransactions, prevDateFilter, filterType, selectedMonth, selectedYear]); // eslint-disable-line react-hooks/exhaustive-deps

  // Metrics derived from actual transactions, scoped to the current date filter
  const filteredMetrics = useMemo(() => {
    const effectiveEnd = dateFilter.endDate <= today ? dateFilter.endDate : today;
    const prevEffectiveEnd = prevDateFilter.endDate <= today ? prevDateFilter.endDate : today;
    const totalLimit = connectedCards.reduce((s, c) => s + (c.creditLimit || 0), 0);

    const cardBalances = connectedCards.map(card => {
      const sorted = [...(allTransactions.get(card.id) ?? [])].sort((a, b) => a.date.localeCompare(b.date));
      const balance = sorted.filter(t => t.date <= effectiveEnd).pop()?.balance ?? 0;
      return { name: `${card.bank} ****${card.lastFour}`, balance };
    });
    const totalOwed = cardBalances.reduce((sum, c) => sum + c.balance, 0);
    const totalAvailable = Math.max(totalLimit - totalOwed, 0);

    const prevTotalOwed = connectedCards.reduce((sum, card) => {
      const sorted = [...(allTransactions.get(card.id) ?? [])].sort((a, b) => a.date.localeCompare(b.date));
      return sum + (sorted.filter(t => t.date <= prevEffectiveEnd).pop()?.balance ?? 0);
    }, 0);
    const prevTotalAvailable = Math.max(totalLimit - prevTotalOwed, 0);

    const owedChangePct = prevTotalOwed > 0 ? ((totalOwed - prevTotalOwed) / prevTotalOwed * 100) : 0;
    const availableChangePct = prevTotalAvailable > 0 ? ((totalAvailable - prevTotalAvailable) / prevTotalAvailable * 100) : 0;

    return { totalOwed, totalAvailable, cardBalances, owedChangePct, availableChangePct };
  }, [connectedCards, allTransactions, dateFilter, prevDateFilter, today]);

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
    loading: loadingTxns || loadingAnalysis,
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
