'use client';

import { LayoutGrid, CreditCard, ArrowLeftRight } from 'lucide-react';
import type { ConnectedCard } from '@/types/card.types';
import type { ViewMode, FilterType } from '@/hooks/useCreditAnalysis';
import { DateFilterControls } from '../DateFilterControls';

interface ChartViewControlsProps {
  // View mode
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedCardId: string;
  onCardChange: (id: string) => void;
  compareCardIds: Set<string>;
  onCompareToggle: (id: string) => void;
  connectedCards: ConnectedCard[];
  palette: string[];
  // Date filter (forwarded to DateFilterControls)
  filterType: FilterType;
  onFilterTypeChange: (type: FilterType) => void;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  selectedYear: string;
  onYearChange: (year: string) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  today: string;
}

const SELECT_CLASS =
  'rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white';

export function ChartViewControls({
  viewMode, onViewModeChange,
  selectedCardId, onCardChange,
  compareCardIds, onCompareToggle,
  connectedCards, palette,
  filterType, onFilterTypeChange,
  selectedMonth, onMonthChange,
  selectedYear, onYearChange,
  startDate, onStartDateChange,
  endDate, onEndDateChange,
  today,
}: ChartViewControlsProps) {
  const tabCls = (active: boolean) =>
    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
      active
        ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-white shadow-sm'
        : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
    }`;

  return (
    <div className="flex flex-col items-end gap-2">
      {/* View mode toggle */}
      <div className="inline-flex items-center rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 p-1 gap-1">
        <button onClick={() => onViewModeChange('consolidated')} className={tabCls(viewMode === 'consolidated')}>
          <LayoutGrid className="h-3.5 w-3.5" />
          All Cards
        </button>
        <button onClick={() => onViewModeChange('individual')} className={tabCls(viewMode === 'individual')}>
          <CreditCard className="h-3.5 w-3.5" />
          Individual
        </button>
        {connectedCards.length > 1 && (
          <button onClick={() => onViewModeChange('compare')} className={tabCls(viewMode === 'compare')}>
            <ArrowLeftRight className="h-3.5 w-3.5" />
            Compare
          </button>
        )}
      </div>

      {/* Individual card selector */}
      {viewMode === 'individual' && (
        <select
          value={selectedCardId}
          onChange={e => onCardChange(e.target.value)}
          className={SELECT_CLASS}
        >
          {connectedCards.map(card => (
            <option key={card.id} value={card.id}>{card.bank} ••••{card.lastFour}</option>
          ))}
        </select>
      )}

      {/* Compare card toggles */}
      {viewMode === 'compare' && connectedCards.length > 1 && (
        <div className="flex flex-wrap justify-end gap-1.5">
          {connectedCards.map((card, idx) => {
            const active = compareCardIds.has(card.id);
            const color = palette[idx % palette.length];
            return (
              <button
                key={card.id}
                onClick={() => onCompareToggle(card.id)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium border transition-all ${
                  active
                    ? 'border-transparent text-white'
                    : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-950'
                }`}
                style={active ? { backgroundColor: color } : {}}
              >
                {card.bank} ••••{card.lastFour}
              </button>
            );
          })}
        </div>
      )}

      {/* Date filter */}
      <DateFilterControls
        filterType={filterType}
        onFilterTypeChange={onFilterTypeChange}
        selectedMonth={selectedMonth}
        onMonthChange={onMonthChange}
        selectedYear={selectedYear}
        onYearChange={onYearChange}
        startDate={startDate}
        onStartDateChange={onStartDateChange}
        endDate={endDate}
        onEndDateChange={onEndDateChange}
        today={today}
        selectClassName={SELECT_CLASS}
      />
    </div>
  );
}
