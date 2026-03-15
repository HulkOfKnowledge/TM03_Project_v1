/**
 * PaymentHistoryTable Component
 * Displays actual payment transactions with shared date controls
 */

'use client';

import { useMemo, useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { DateFilterControls } from '../DateFilterControls';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { formatCurrency, formatDate } from '../transaction-utils';
import type { PaymentTransactionRow } from '@/types/card.types';
import type { FilterType } from '@/hooks/useCreditAnalysis';

interface PaymentHistoryTableProps {
  data: PaymentTransactionRow[];
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
  title?: string;
  subtitle?: string;
}

export function PaymentHistoryTable({
  data,
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
  today,
  title = 'Payment History',
  subtitle,
}: PaymentHistoryTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'date' | 'cardName' | 'amountPaid'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [data, searchQuery]);

  // Search only  date range is handled by shared DateFilterControls state upstream.
  const filteredData = useMemo(() => {
    return data.filter(row => {
      const searchLower = searchQuery.toLowerCase();
      return (
        !searchQuery ||
        row.date.toLowerCase().includes(searchLower) ||
        row.cardName.toLowerCase().includes(searchLower) ||
        row.description.toLowerCase().includes(searchLower)
      );
    });
  }, [data, searchQuery]);

  const sortedData = useMemo(() => {
    const next = [...filteredData];
    next.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') comparison = a.date.localeCompare(b.date);
      if (sortField === 'cardName') comparison = a.cardName.localeCompare(b.cardName);
      if (sortField === 'amountPaid') comparison = a.amountPaid - b.amountPaid;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return next;
  }, [filteredData, sortDirection, sortField]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pageData = sortedData.slice(pageStart, pageStart + pageSize);

  const groupedMobileData = useMemo(() => {
    const groups = new Map<string, PaymentTransactionRow[]>();
    for (const row of pageData) {
      const current = groups.get(row.date) ?? [];
      current.push(row);
      groups.set(row.date, current);
    }
    return Array.from(groups.entries());
  }, [pageData]);

  const handleSort = (field: 'date' | 'cardName' | 'amountPaid') => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortField(field);
    setSortDirection('asc');
  };

  const getSortIcon = (field: 'date' | 'cardName' | 'amountPaid') => {
    if (sortField !== field) return null;
    return <span className="text-xs text-gray-500 dark:text-gray-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="mb-6 sm:mb-8">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
              {subtitle}
            </p>
          )}
        </div>
        <div className="hidden md:block">
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
          />
        </div>
      </div>

      <div className="mb-4 md:hidden">
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
        />
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, transaction, anything"
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:placeholder-gray-500"
        />
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="md:hidden">
          {groupedMobileData.length === 0 ? (
            <div className="border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center dark:border-gray-700 dark:bg-gray-900/40">
              <p className="text-sm text-gray-500 dark:text-gray-400">No payment records found for this view.</p>
            </div>
          ) : (
            <div className="border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950">
              {groupedMobileData.map(([date, items], groupIndex) => (
                <section key={date}>
                  <div className="bg-gray-50 px-4 py-2.5 dark:bg-gray-900/50">
                    <p className="text-sm font-semibold tracking-wide text-gray-700 dark:text-gray-300">{formatDate(date)}</p>
                  </div>

                  {items.map((row) => (
                    <div
                      key={row.id}
                      className="flex items-start justify-between gap-3 border-t border-gray-200 px-4 py-3 dark:border-gray-800"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium leading-5 text-gray-900 dark:text-white">{row.description}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{row.cardName}</p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-[15px] font-semibold leading-5 text-green-600 dark:text-green-400">
                          {formatCurrency(row.amountPaid)}
                        </p>
                        {row.balance !== undefined && (
                          <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                            {formatCurrency(row.balance)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {groupIndex !== groupedMobileData.length - 1 && (
                    <div className="h-2 bg-gray-50 dark:bg-gray-900/30" />
                  )}
                </section>
              ))}
            </div>
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr className="bg-gray-50 text-left text-xs dark:bg-gray-900 sm:text-sm">
                <th
                  className="cursor-pointer px-3 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 sm:px-4"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-2">Date {getSortIcon('date')}</div>
                </th>
                <th
                  className="cursor-pointer px-3 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 sm:px-4"
                  onClick={() => handleSort('cardName')}
                >
                  <div className="flex items-center gap-2">Card {getSortIcon('cardName')}</div>
                </th>
                <th className="px-3 py-3 font-medium text-gray-700 dark:text-gray-300 sm:px-4">Description</th>
                <th
                  className="cursor-pointer px-3 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 sm:px-4"
                  onClick={() => handleSort('amountPaid')}
                >
                  <div className="flex items-center gap-2">Amount Paid {getSortIcon('amountPaid')}</div>
                </th>
                <th className="px-3 py-3 font-medium text-gray-700 dark:text-gray-300 sm:px-4">Balance After</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-950">
              {pageData.map((row) => (
                <tr key={row.id} className="border-b border-gray-200 last:border-0 dark:border-gray-800">
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-900 dark:text-white sm:px-4 sm:py-4 sm:text-sm">
                    {formatDate(row.date)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-900 dark:text-white sm:px-4 sm:py-4 sm:text-sm">
                    {row.cardName}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-900 dark:text-white sm:px-4 sm:py-4 sm:text-sm">
                    <span className="block max-w-xs truncate">{row.description}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs font-semibold text-green-600 dark:text-green-400 sm:px-4 sm:py-4 sm:text-sm">
                    {formatCurrency(row.amountPaid)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-900 dark:text-white sm:px-4 sm:py-4 sm:text-sm">
                    {row.balance !== undefined ? formatCurrency(row.balance) : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <PaginationControls
          currentPage={safePage}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={sortedData.length}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
