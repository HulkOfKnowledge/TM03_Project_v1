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
import { Info } from 'lucide-react';
import { useState } from 'react';
import type { ConnectedCard } from '@/types/card.types';
import { useCreditAnalysis } from '@/hooks/useCreditAnalysis';
import { DateFilterControls } from '../DateFilterControls';
import { MetricCard } from './MetricCard';
import { ChartSection } from './ChartSection';
import { ChartViewControls } from './ChartViewControls';
import { PaymentHistoryTable } from './PaymentHistoryTable';
import { RecommendedActions } from './RecommendedActions';
import { PaymentRecommendationModal } from '../PaymentRecommendationModal';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler);

interface CreditAnalysisProps {
  connectedCards: ConnectedCard[];
}

export function CreditAnalysis({ connectedCards }: CreditAnalysisProps) {
  const [showPaymentRec, setShowPaymentRec] = useState(false);

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
    analysisData,
    utilizationChartData,
    utilizationChartOptions,
    spendingChartData,
    spendingChartOptions,
    chartMetrics,
    filteredPaymentHistory,
  } = useCreditAnalysis(connectedCards);

  const handleCompareToggle = (cardId: string) =>
    setCompareCardIds(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) { if (next.size > 1) next.delete(cardId); }
      else next.add(cardId);
      return next;
    });

  const chartControls = (
    <ChartViewControls
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
  );

  //  Loading skeleton
  if (loading) {
    return (
      <div className="mx-auto">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-start md:justify-between">
          <div className="flex-1">
            <h1 className="mb-3 text-3xl font-bold text-brand md:text-4xl">Credit Analysis</h1>
            <p className="text-base text-gray-600 dark:text-gray-400">Understand your card breakdowns at a glance</p>
          </div>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          <div className="h-32 bg-gray-200 dark:bg-gray-800 rounded-xl" />
          <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        </div>
      </div>
    );
  }

  
  return (
    <div className="mx-auto">

      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-start md:justify-between">
        <div className="flex-1">
          <h1 className="mb-3 text-3xl font-bold text-brand md:text-4xl">Credit Analysis</h1>
          <p className="text-base text-gray-600 dark:text-gray-400">
            Understand your card breakdowns at a glance
          </p>
        </div>
        <div className="self-start md:self-auto">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowPaymentRec(true)}
              className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90 dark:hover:bg-brand/90"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Payment Recommendation
            </button>
            <DateFilterControls
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
              selectClassName="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white sm:px-4 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Date badge */}
      <div className="mb-6 inline-flex items-center gap-2 rounded-lg bg-indigo-100 px-3 py-1.5 text-sm font-medium text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
        <Info className="h-4 w-4" />
        Data for {dateFilter.label}
      </div>

      {/* Top Metrics */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-2">
        <MetricCard
          label="Total Credit Available"
          value={`$${filteredMetrics.totalAvailable.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          trend={{
            value: `${filteredMetrics.availableChangePct >= 0 ? '+' : ''}${filteredMetrics.availableChangePct.toFixed(2)}% vs ${chartMetrics.prevLabel}`,
            isPositive: filteredMetrics.availableChangePct >= 0,
          }}
          showInfo
        />
        <MetricCard
          label="Total Amount Owed"
          value={`$${filteredMetrics.totalOwed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          trend={{
            value: `${filteredMetrics.owedChangePct >= 0 ? '+' : ''}${filteredMetrics.owedChangePct.toFixed(2)}% vs ${chartMetrics.prevLabel}`,
            isPositive: filteredMetrics.owedChangePct <= 0,
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
          value: `${chartMetrics.utilDiff >= 0 ? '+' : ''}${chartMetrics.utilDiff.toFixed(1)}pp vs ${chartMetrics.prevLabel}`,
          isPositive: chartMetrics.utilDiff < 0,
        }}
        valueClassName={chartMetrics.lastUtil > 30 ? 'text-4xl text-red-600 dark:text-red-500 sm:text-5xl' : 'text-4xl text-gray-900 dark:text-white sm:text-5xl'}
        headerControls={chartControls}
      >
        <Line data={utilizationChartData} options={utilizationChartOptions} />
      </ChartSection>

      {/* Spending Patterns */}
      <ChartSection
        title="Spending Patterns"
        primaryValue={`$${chartMetrics.totalSpend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
        primaryLabel="Total spending"
        trend={{
          value: `${chartMetrics.spendTrendPct >= 0 ? '+' : ''}${chartMetrics.spendTrendPct.toFixed(1)}% vs ${chartMetrics.prevLabel}`,
          isPositive: chartMetrics.spendTrendPct <= 0,
        }}
        headerControls={chartControls}
      >
        <Line data={spendingChartData} options={spendingChartOptions} />
      </ChartSection>

      {/* Payment History */}
      <PaymentHistoryTable data={filteredPaymentHistory} />

      {/* Recommended Actions */}
      <RecommendedActions insights={analysisData?.mlInsights?.insights} />

      {/* Payment Recommendation Modal */}
      <PaymentRecommendationModal
        isOpen={showPaymentRec}
        onClose={() => setShowPaymentRec(false)}
        cards={connectedCards}
      />
    </div>
  );
}