'use client';

import { useMemo } from 'react';
import { X, Calendar, LayoutGrid, CreditCard, Check } from 'lucide-react';
import type { ConnectedCard } from '@/types/card.types';
import type { ViewMode, FilterType } from '@/hooks/useCreditAnalysis';

interface ChartSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  selectedCardId: string;
  onCardChange: (id: string) => void;
  compareCardIds: Set<string>;
  onCompareToggle: (id: string) => void;
  connectedCards: ConnectedCard[];
  palette: string[];
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

export function ChartSettingsModal({
  isOpen, onClose,
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
}: ChartSettingsModalProps) {
  const monthOptions = useMemo(() => {
    const opts: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      opts.push({
        value: d.toISOString().slice(0, 7),
        label: d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
      });
    }
    return opts;
  }, []);

  const yearOptions = useMemo(() => {
    const cur = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => (cur - i).toString());
  }, []);

  if (!isOpen) return null;

  const pillActive =
    'flex-1 rounded-lg bg-indigo-600 py-2 px-1 text-xs font-medium text-white transition-all sm:text-sm';
  const pillInactive =
    'flex-1 rounded-lg border border-gray-200 py-2 px-1 text-xs font-medium text-gray-600 transition-all hover:border-indigo-300 hover:text-indigo-600 dark:border-gray-700 dark:text-gray-400 dark:hover:border-indigo-600 dark:hover:text-indigo-400 sm:text-sm';

  const inputClass =
    'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden bg-white shadow-2xl dark:bg-gray-950 sm:max-h-[85vh] sm:max-w-md sm:rounded-2xl sm:border sm:border-gray-200 sm:dark:border-gray-800 rounded-t-2xl border-t border-x border-gray-200 dark:border-gray-800">
        {/* Drag handle — mobile only */}
        <div className="flex justify-center pt-3 sm:hidden">
          <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-700" />
        </div>

        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4 dark:border-gray-800">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Chart Settings</h3>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Adjust view and date range</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5 [scrollbar-color:#e5e7eb_transparent] [scrollbar-width:thin] dark:[scrollbar-color:#374151_transparent] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb:hover]:bg-gray-300 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-1 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 dark:[&::-webkit-scrollbar-thumb:hover]:bg-gray-600">
          {/* ── Date Range ── */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-indigo-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Date Range
              </span>
            </div>

            {/* Filter type pill toggle */}
            <div className="mb-3 flex gap-2">
              {(['month', 'year', 'range'] as FilterType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => onFilterTypeChange(type)}
                  className={filterType === type ? pillActive : pillInactive}
                >
                  {type === 'month' ? 'Month' : type === 'year' ? 'Year' : 'Custom'}
                </button>
              ))}
            </div>

            {filterType === 'month' && (
              <select
                value={selectedMonth}
                onChange={(e) => onMonthChange(e.target.value)}
                className={inputClass}
              >
                {monthOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            )}

            {filterType === 'year' && (
              <select
                value={selectedYear}
                onChange={(e) => onYearChange(e.target.value)}
                className={inputClass}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            )}

            {filterType === 'range' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="mb-1.5 text-xs text-gray-500 dark:text-gray-400">From</p>
                  <input
                    type="date"
                    value={startDate}
                    max={today}
                    onChange={(e) => {
                      const v = e.target.value;
                      onStartDateChange(v);
                      if (endDate && v > endDate) onEndDateChange(v);
                    }}
                    className={inputClass}
                  />
                </div>
                <div>
                  <p className="mb-1.5 text-xs text-gray-500 dark:text-gray-400">To</p>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    max={today}
                    onChange={(e) => onEndDateChange(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            )}
          </section>

          <div className="h-px bg-gray-100 dark:bg-gray-800" />

          {/* ── Chart View ── */}
          <section>
            <div className="mb-3 flex items-center gap-2">
              <LayoutGrid className="h-3.5 w-3.5 text-indigo-500" />
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Chart View
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onViewModeChange('consolidated')}
                className={viewMode === 'consolidated' ? pillActive : pillInactive}
              >
                All Cards
              </button>
              <button
                onClick={() => onViewModeChange('individual')}
                className={viewMode === 'individual' ? pillActive : pillInactive}
              >
                Individual
              </button>
              {connectedCards.length > 1 && (
                <button
                  onClick={() => onViewModeChange('compare')}
                  className={viewMode === 'compare' ? pillActive : pillInactive}
                >
                  Compare
                </button>
              )}
            </div>
          </section>

          {/* ── Individual card selector ── */}
          {viewMode === 'individual' && connectedCards.length > 0 && (
            <section>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Select Card
              </p>
              <div className="space-y-2">
                {connectedCards.map((card, idx) => {
                  const color = palette[idx % palette.length];
                  const selected = selectedCardId === card.id;
                  return (
                    <button
                      key={card.id}
                      onClick={() => onCardChange(card.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                        selected
                          ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-500 dark:bg-indigo-950/30'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                      }`}
                    >
                      <div
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
                        style={{ background: color + '22', border: `2px solid ${color}` }}
                      >
                        <CreditCard className="h-4 w-4" style={{ color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{card.bank}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">••••{card.lastFour}</p>
                      </div>
                      {selected && (
                        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600">
                          <Check className="h-3 w-3 text-white" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* ── Compare card toggles ── */}
          {viewMode === 'compare' && connectedCards.length > 1 && (
            <section>
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Compare Cards
              </p>
              <p className="mb-3 text-xs text-gray-400 dark:text-gray-500">Select 2 or more cards to compare</p>
              <div className="space-y-2">
                {connectedCards.map((card, idx) => {
                  const color = palette[idx % palette.length];
                  const active = compareCardIds.has(card.id);
                  return (
                    <button
                      key={card.id}
                      onClick={() => onCompareToggle(card.id)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                        active
                          ? 'border-transparent'
                          : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                      }`}
                      style={active ? { background: color + '18', borderColor: color + '60' } : {}}
                    >
                      <div
                        className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
                        style={{ background: color + '22', border: `2px solid ${color}` }}
                      >
                        <CreditCard className="h-4 w-4" style={{ color }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{card.bank}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">••••{card.lastFour}</p>
                      </div>
                      {active && (
                        <span
                          className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
                          style={{ background: color }}
                        >
                          <Check className="h-3 w-3 text-white" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-gray-100 px-5 py-4 dark:border-gray-800">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 active:bg-indigo-800"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
