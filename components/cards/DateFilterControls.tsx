'use client';

import { useMemo } from 'react';

type FilterType = 'month' | 'range' | 'year';

interface DateFilterControlsProps {
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
  today?: string;
  selectClassName?: string;
}

const DEFAULT_SELECT_CLASS =
  'rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white';

export function DateFilterControls({
  filterType,
  onFilterTypeChange,
  selectedMonth,
  onMonthChange,
  selectedYear,
  onYearChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  today = new Date().toISOString().split('T')[0],
  selectClassName = DEFAULT_SELECT_CLASS,
}: DateFilterControlsProps) {
  const monthOptions = useMemo(() => {
    const opts = [];
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

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={filterType}
        onChange={e => onFilterTypeChange(e.target.value as FilterType)}
        className={selectClassName}
      >
        <option value="month">Month</option>
        <option value="year">Year</option>
        <option value="range">Date Range</option>
      </select>

      {filterType === 'month' && (
        <select
          value={selectedMonth}
          onChange={e => onMonthChange(e.target.value)}
          className={selectClassName}
        >
          {monthOptions.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}

      {filterType === 'year' && (
        <select
          value={selectedYear}
          onChange={e => onYearChange(e.target.value)}
          className={selectClassName}
        >
          {yearOptions.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      )}

      {filterType === 'range' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            max={today}
            onChange={e => {
              const newStart = e.target.value;
              onStartDateChange(newStart);
              if (endDate && newStart > endDate) onEndDateChange(newStart);
            }}
            className={selectClassName}
          />
          <span className="text-gray-500">to</span>
          <input
            type="date"
            value={endDate}
            min={startDate}
            max={today}
            onChange={e => onEndDateChange(e.target.value)}
            className={selectClassName}
          />
        </div>
      )}
    </div>
  );
}
