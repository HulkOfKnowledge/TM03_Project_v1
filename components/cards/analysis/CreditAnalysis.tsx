/**
 * Credit Analysis Component
 * Consolidated view of all credit card information
 */

'use client';

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
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { Info, SlidersHorizontal, ChevronDown, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { ConnectedCard } from '@/types/card.types';
import { useCreditAnalysis } from '@/hooks/useCreditAnalysis';
import { useTheme } from '@/components/ThemeProvider';
import { MetricCard } from './MetricCard';
import { ChartSection } from './ChartSection';
import { ChartSettingsModal } from './ChartSettingsModal';
import { CreditAnalysisSkeleton } from './CreditAnalysisSkeleton';
import { PaymentRecommendationModal } from '../PaymentRecommendationModal';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

interface CreditAnalysisProps {
  connectedCards: ConnectedCard[];
  onAddCard: () => void;
}

interface ForecastActionPlan {
  summary: string;
  items: Array<{
    id: string;
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    rationale: string;
    actionType: 'spend_cap' | 'payment' | 'review';
  }>;
}

interface ForecastInsightsPayload {
  actionPlan: ForecastActionPlan | null;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
}

export function CreditAnalysis({ connectedCards, onAddCard }: CreditAnalysisProps) {
  const [showPaymentRec, setShowPaymentRec] = useState(false);
  const [showChartSettings, setShowChartSettings] = useState(false);
  const [smartActionPlan, setSmartActionPlan] = useState<ForecastActionPlan | null>(null);
  const [loadingSmartActions, setLoadingSmartActions] = useState(false);
  const { resolvedTheme } = useTheme();

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
    filteredMetrics,
    loading,
    utilizationChartData,
    utilizationChartOptions,
    spendingChartData,
    spendingChartOptions,
    chartMetrics,
  } = useCreditAnalysis(connectedCards);

  useEffect(() => {
    let active = true;

    const loadSmartActions = async () => {
      if (!connectedCards.length) {
        setSmartActionPlan(null);
        return;
      }

      setLoadingSmartActions(true);

      try {
        const response = await fetch('/api/credit-intelligence/forecast-insights', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startDate: dateFilter.startDate,
            endDate: dateFilter.endDate,
            cardId: viewMode === 'individual' ? selectedCardId : undefined,
            cardIds: viewMode === 'compare' ? Array.from(compareCardIds) : undefined,
          }),
        });

        const result = (await response.json()) as ApiEnvelope<ForecastInsightsPayload>;
        if (!active) return;

        if (!response.ok || !result.success || !result.data) {
          setSmartActionPlan(null);
        } else {
          setSmartActionPlan(result.data.actionPlan ?? null);
        }
      } catch {
        if (!active) return;
        setSmartActionPlan(null);
      } finally {
        if (active) setLoadingSmartActions(false);
      }
    };

    loadSmartActions();

    return () => {
      active = false;
    };
  }, [connectedCards, dateFilter.startDate, dateFilter.endDate, viewMode, selectedCardId, compareCardIds]);

  const handleCompareToggle = (cardId: string) =>
    setCompareCardIds(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) { if (next.size > 1) next.delete(cardId); }
      else next.add(cardId);
      return next;
    });

  const chartSettingsButton = (
    <button
      onClick={() => setShowChartSettings(true)}
      className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-500 transition-all hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600 dark:border-gray-700 dark:text-gray-400 dark:hover:border-indigo-600 dark:hover:bg-indigo-950/20 dark:hover:text-indigo-400"
    >
      <SlidersHorizontal className="h-3.5 w-3.5" />
      Filters
    </button>
  );

  const formatSignedCurrencyDelta = (amount: number) => {
    const abs = Math.abs(amount).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const sign = amount >= 0 ? '+' : '-';
    return `${sign} $${abs}`;
  };

  //  Loading skeleton
  if (loading) {
    return <CreditAnalysisSkeleton />;
  }

  
  return (
    <div className="mx-auto">

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="mb-3 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <h1 className="mb-1.5 text-2xl font-bold text-brand sm:text-3xl md:text-4xl">Credit Analysis</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 sm:text-base">
              Understand your card breakdowns at a glance
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start">
            <button
              onClick={() => setShowPaymentRec(true)}
              className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-brand px-4 py-2 font-medium text-white transition-colors hover:bg-brand/90"
            >
              <svg className="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Payment Recommendation
            </button>
            <button
              onClick={onAddCard}
              className="flex items-center gap-2 whitespace-nowrap rounded-lg border-2 border-indigo-600 px-4 py-2 font-medium text-indigo-600 transition-colors hover:bg-indigo-50 dark:border-indigo-500 dark:text-indigo-500 dark:hover:bg-indigo-950/30"
            >
              <Plus className="h-4 w-4" />
              Add Card
            </button>
          </div>
        </div>

        {/* Filter summary — tap to open chart settings */}
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

      {/* Top Metrics */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-2">
        <MetricCard
          label="Total Credit Available"
          value={`$${filteredMetrics.totalAvailable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          trend={{
            value: `${formatSignedCurrencyDelta(filteredMetrics.availableChangeAmount)} vs ${chartMetrics.prevLabel}`,
            isPositive: filteredMetrics.availableChangeAmount >= 0,
          }}
          showInfo
        />
        <MetricCard
          label="Total Amount Owed"
          value={`$${filteredMetrics.totalOwed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          trend={{
            value: `${formatSignedCurrencyDelta(filteredMetrics.owedChangeAmount)} vs ${chartMetrics.prevLabel}`,
            isPositive: filteredMetrics.owedChangeAmount <= 0,
          }}
          showInfo
        />

        {/* Per-card balances */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 sm:p-6 lg:col-span-2">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-shrink-0">
              <span className="mb-2 block text-xs text-gray-600 dark:text-gray-400 sm:text-sm">Data per card</span>
              <p className="mb-2 text-3xl text-gray-900 dark:text-white">
                {connectedCards.length} Cards
              </p>
              <p className="inline-block rounded bg-gray-50 px-3 py-1.5 text-[10px] text-gray-500 dark:bg-gray-900 dark:text-gray-500 sm:text-xs">
                This is based on your connected cards. Connect more to see a detailed breakdown.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 sm:gap-0">
              {(filteredMetrics.cardBalances).map((card, index) => (
                <div key={index} className="flex items-center">
                  {index > 0 && (
                    <div className="mx-4 hidden h-12 w-px bg-gray-200 dark:bg-gray-800 sm:block sm:mx-6 sm:h-16" />
                  )}
                  <div className="flex flex-col items-center">
                    <p className="mb-1 text-[10px] text-gray-500 dark:text-gray-500 sm:text-xs">{card.name}</p>
                    <p className="text-2xl text-gray-900 dark:text-white sm:text-3xl md:text-4xl">${card.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
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
        primaryValue={`${chartMetrics.lastUtil.toFixed(2)}%`}
        primaryLabel="Utilization percentage"
        trend={{
          value: `${chartMetrics.utilDiff >= 0 ? '+' : ''}${chartMetrics.utilDiff.toFixed(1)}% vs ${chartMetrics.prevLabel}`,
          isPositive: chartMetrics.utilDiff < 0,
        }}
        valueClassName={chartMetrics.lastUtil > 30 ? 'text-4xl text-red-600 dark:text-red-500 sm:text-5xl' : 'text-4xl text-gray-900 dark:text-white sm:text-5xl'}
        headerControls={chartSettingsButton}
      >
        <Line key={`util-${resolvedTheme}`} data={utilizationChartData} options={utilizationChartOptions} />
      </ChartSection>

      {/* Spending Patterns */}
      <ChartSection
        title="Spending Rate"
        primaryValue={`$${chartMetrics.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        primaryLabel="Total spending"
        trend={{
          value: `${formatSignedCurrencyDelta(chartMetrics.spendChangeAmount)} vs ${chartMetrics.prevLabel}`,
          isPositive: chartMetrics.spendChangeAmount <= 0,
        }}
        headerControls={chartSettingsButton}
      >
        <Line key={`spend-${resolvedTheme}`} data={spendingChartData} options={spendingChartOptions} />
      </ChartSection>

      {/* Smart Actions */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 sm:mb-8 sm:p-6">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-base text-gray-700 dark:text-gray-300 sm:text-lg">Smart Action Plan</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">next best steps</p>
        </div>

        {loadingSmartActions ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">Building your action plan...</p>
        ) : smartActionPlan?.items?.length ? (
          <>
            <p className="mb-3 text-sm text-gray-600 dark:text-gray-400">{smartActionPlan.summary}</p>
            <div className="space-y-2">
              {smartActionPlan.items.map((item, index) => {
                const badgeTone = item.priority === 'high'
                  ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                  : item.priority === 'medium'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';

                return (
                  <div key={item.id} className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{index + 1}. {item.title}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${badgeTone}`}>
                        {item.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{item.description}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Why: {item.rationale}</p>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-600 dark:text-gray-400">No immediate action needed right now. Your spending trend is stable.</p>
        )}
      </div>

      {/* Chart Settings Modal */}
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

      {/* Payment Recommendation Modal */}
      <PaymentRecommendationModal
        isOpen={showPaymentRec}
        onClose={() => setShowPaymentRec(false)}
        cards={connectedCards}
      />
    </div>
  );
}