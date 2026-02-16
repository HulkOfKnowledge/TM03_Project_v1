/**
 * DataTable Component
 * Reusable table with sorting, custom rendering, and responsive design
 */

'use client';

import { useState, ReactNode } from 'react';

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
  onRowClick?: (row: T, index: number) => void;
  renderRowPrefix?: (row: T, index: number) => ReactNode;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  onRowClick,
  renderRowPrefix,
  className = '',
}: DataTableProps<T>) {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

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
          {sortedData.map((row, index) => (
            <tr
              key={index}
              className={`border-b border-gray-200 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/50 ${
                onRowClick ? 'cursor-pointer' : ''
              }`}
              onClick={() => onRowClick?.(row, index)}
            >
              {renderRowPrefix && (
                <td className="px-3 py-3 sm:px-4 sm:py-4">
                  {renderRowPrefix(row, index)}
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
                    ? column.render(row, index)
                    : (row as any)[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
