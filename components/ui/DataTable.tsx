/**
 * DataTable Component
 * Reusable table with sorting, custom rendering, and responsive design
 */

'use client';

import { useState, ReactNode, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type SortDirection = 'asc' | 'desc' | null;

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (row: T, index: number) => ReactNode;
  sortFn?: (a: T, b: T, direction: SortDirection) => number;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  pageSize?: number;
  onRowClick?: (row: T, index: number) => void;
  renderRowPrefix?: (row: T, index: number) => ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  pageSize = 20,
  onRowClick,
  renderRowPrefix,
  className = '',
}: DataTableProps<T>) {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever the data changes (e.g. filter applied)
  useEffect(() => { setCurrentPage(1); }, [data]);

  const handleSort = (column: Column<T>) => {
    if (!column.sortable) return;

    if (sortField === column.key) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(column.key);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (sortField !== columnKey || !sortDirection) return null;
    return (
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  const sortedData = [...data];
  if (sortField && sortDirection) {
    const column = columns.find((col) => col.key === sortField);
    
    sortedData.sort((a, b) => {
      // Use custom sort function if provided
      if (column?.sortFn) {
        return column.sortFn(a, b, sortDirection);
      }

      // Default sorting logic
      const aVal = (a as any)[sortField];
      const bVal = (b as any)[sortField];

      // Handle string values that start with $ (currency)
      if (typeof aVal === 'string' && aVal.startsWith('$')) {
        const aNum = parseFloat(aVal.replace(/[$,]/g, ''));
        const bNum = parseFloat(bVal.replace(/[$,]/g, ''));
        return sortDirection === 'asc' ? aNum - bNum : bNum - aNum;
      }

      // Handle numeric values
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      // Handle string values
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        const comparison = aVal.localeCompare(bVal);
        return sortDirection === 'asc' ? comparison : -comparison;
      }

      return 0;
    });
  }

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const pageData = sortedData.slice(pageStart, pageStart + pageSize);

  return (
    <div className={`overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800 ${className}`}>
      <table className="w-full min-w-[800px]">
        <thead>
          <tr className="bg-gray-50 text-left text-xs dark:bg-gray-900 sm:text-sm">
            {columns.map((column) => (
              <th
                key={column.key}
                className={`px-3 py-3 font-medium text-gray-700 dark:text-gray-300 sm:px-4 ${
                  column.sortable
                    ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
                    : ''
                } ${column.className || ''}`}
                onClick={() => column.sortable && handleSort(column)}
              >
                <div className="flex items-center gap-2">
                  {column.header}
                  {column.sortable && getSortIcon(column.key)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-950">
          {pageData.map((row, index) => (
            <tr
              key={pageStart + index}
              className={`border-b border-gray-200 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/50 ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
              onClick={() => onRowClick?.(row, pageStart + index)}
            >
              {renderRowPrefix && (
                <td className="px-3 py-3 sm:px-4 sm:py-4">
                  {renderRowPrefix(row, pageStart + index)}
                </td>
              )}
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`whitespace-nowrap px-3 py-3 text-xs text-gray-900 dark:text-white sm:px-4 sm:py-4 sm:text-sm ${
                    column.className || ''
                  }`}
                >
                  {column.render
                    ? column.render(row, pageStart + index)
                    : (row as any)[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {pageStart + 1}–{Math.min(pageStart + pageSize, sortedData.length)} of {sortedData.length}
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - safePage) <= 1)
              .reduce<(number | '…')[]>((acc, p, i, arr) => {
                if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push('…');
                acc.push(p);
                return acc;
              }, [])
              .map((p, i) =>
                p === '…' ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-xs text-gray-400">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p as number)}
                    className={`min-w-[28px] rounded px-1.5 py-1 text-xs font-medium ${
                      safePage === p
                        ? 'bg-indigo-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="rounded p-1.5 text-gray-500 hover:bg-gray-100 disabled:opacity-30 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
