/**
 * Card History Table Component
 * Displays transaction history with sorting and selection
 */

'use client';

import { useState } from 'react';
import type { CardHistoryRow, SortField, SortDirection } from '@/types/card.types';

interface CardHistoryTableProps {
  data: CardHistoryRow[];
}

export function CardHistoryTable({ data }: CardHistoryTableProps) {
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const toggleRow = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    if (sortDirection === 'asc') return '↑';
    if (sortDirection === 'desc') return '↓';
    return null;
  };

  // Month order for sorting
  const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Zone order for sorting (Safe -> Caution -> Danger)
  const zoneOrder = { 'Safe': 1, 'Caution': 2, 'Danger': 3 };

  const sortedData = [...data];
  if (sortField && sortDirection) {
    sortedData.sort((a, b) => {
      let comparison = 0;

      if (sortField === 'zone') {
        // Sort by zone: Safe -> Caution -> Danger (asc) or reverse (desc)
        comparison = zoneOrder[a.zone] - zoneOrder[b.zone];
      } else if (sortField === 'month') {
        // Sort by month chronologically
        comparison = monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
      } else {
        // Convert currency strings to numbers for sorting
        let aVal: any = a[sortField];
        let bVal: any = b[sortField];

        if (typeof aVal === 'string' && aVal.startsWith('$')) {
          aVal = parseFloat(aVal.replace(/[$,]/g, ''));
          bVal = parseFloat(bVal.replace(/[$,]/g, ''));
        }

        if (aVal < bVal) comparison = -1;
        else if (aVal > bVal) comparison = 1;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  const getZoneColor = (zone: string) => {
    switch (zone) {
      case 'Safe':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      case 'Caution':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Danger':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-100 text-left text-sm dark:bg-gray-900">
            <th 
              className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              onClick={() => handleSort('zone')}
            >
              <div className="flex items-center gap-2">
                Zone {getSortIcon('zone') && <span className="text-xs">{getSortIcon('zone')}</span>}
              </div>
            </th>
            <th 
              className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              onClick={() => handleSort('month')}
            >
              <div className="flex items-center gap-2">
                Month {getSortIcon('month') && <span className="text-xs">{getSortIcon('month')}</span>}
              </div>
            </th>
            <th 
              className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              onClick={() => handleSort('startBalance')}
            >
              <div className="flex items-center gap-2">
                Start Balance {getSortIcon('startBalance') && <span className="text-xs">{getSortIcon('startBalance')}</span>}
              </div>
            </th>
            <th 
              className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              onClick={() => handleSort('endingBalance')}
            >
              <div className="flex items-center gap-2">
                Ending Balance {getSortIcon('endingBalance') && <span className="text-xs">{getSortIcon('endingBalance')}</span>}
              </div>
            </th>
            <th 
              className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              onClick={() => handleSort('peakUsage')}
            >
              <div className="flex items-center gap-2">
                Peak Usage {getSortIcon('peakUsage') && <span className="text-xs">{getSortIcon('peakUsage')}</span>}
              </div>
            </th>
            <th 
              className="px-4 py-3 font-medium cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              onClick={() => handleSort('payment')}
            >
              <div className="flex items-center gap-2">
                Payment {getSortIcon('payment') && <span className="text-xs">{getSortIcon('payment')}</span>}
              </div>
            </th>
            <th className="px-4 py-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-950">
          {sortedData.map((row, index) => (
            <tr
              key={index}
              className="border-b border-gray-200 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/50"
            >
              <td className="px-4 py-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(index)}
                    onChange={() => toggleRow(index)}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className={`inline-block rounded px-3 py-1 text-xs font-medium ${getZoneColor(row.zone)}`}>
                    {row.zone}
                  </span>
                </div>
              </td>
              <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                {row.month}
              </td>
              <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                {row.startBalance}
              </td>
              <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                {row.endingBalance}
              </td>
              <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                {row.peakUsage}
              </td>
              <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                {row.payment}
              </td>
              <td className="px-4 py-4">
                <button className="text-sm text-gray-900 underline hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400">
                  View Note
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
