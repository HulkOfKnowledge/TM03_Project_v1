/**
 * Card History Table Component
 * Displays transaction history with sorting and selection
 */

'use client';

import { useState, useMemo } from 'react';
import type { CardHistoryRow } from '@/types/card.types';
import { DataTable, Column } from '@/components/ui/DataTable';

interface CardHistoryTableProps {
  data: CardHistoryRow[];
}

export function CardHistoryTable({ data }: CardHistoryTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  const toggleRow = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
  };

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

  // Month order for sorting
  const monthOrder = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
  // Zone order for sorting (Safe -> Caution -> Danger)
  const zoneOrder: { [key: string]: number } = { 'Safe': 1, 'Caution': 2, 'Danger': 3 };

  const columns: Column<CardHistoryRow>[] = useMemo(() => [
    {
      key: 'zone',
      header: 'Zone',
      sortable: true,
      sortFn: (a, b, direction) => {
        const comparison = zoneOrder[a.zone] - zoneOrder[b.zone];
        return direction === 'asc' ? comparison : -comparison;
      },
      render: (row, index) => (
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
      ),
    },
    {
      key: 'month',
      header: 'Month',
      sortable: true,
      sortFn: (a, b, direction) => {
        const comparison = monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
        return direction === 'asc' ? comparison : -comparison;
      },
    },
    {
      key: 'startBalance',
      header: 'Start Balance',
      sortable: true,
    },
    {
      key: 'endingBalance',
      header: 'Ending Balance',
      sortable: true,
    },
    {
      key: 'peakUsage',
      header: 'Peak Usage',
      sortable: true,
    },
    {
      key: 'payment',
      header: 'Payment',
      sortable: true,
    },
    {
      key: 'action',
      header: 'Action',
      sortable: false,
      render: () => (
        <button className="text-sm text-gray-900 underline hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400">
          View Note
        </button>
      ),
    },
  ], [selectedRows]);

  return <DataTable columns={columns} data={data} />;
}
