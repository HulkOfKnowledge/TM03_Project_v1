/**
 * Daily Transaction Table Component
 * Displays daily transaction history with sorting, zones, and action column
 */

'use client';

import { useState, useMemo } from 'react';
import type { Transaction, ConnectedCard } from '@/types/card.types';
import { DataTable, Column } from '@/components/ui/DataTable';
import { TransactionInsightModal } from './TransactionInsightModal';

interface DailyTransactionTableProps {
  data: Transaction[];
  card: ConnectedCard;
}

export function DailyTransactionTable({ data, card }: DailyTransactionTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewNote = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
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

  const formatCurrency = (amount: number) => {
    const absAmount = Math.abs(amount);
    return `$${absAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // local midnight  avoids UTC-offset day shift
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getZoneColor = (zone: string | undefined) => {
    if (!zone) return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    switch (zone) {
      case 'Safe':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'Caution':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Danger':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getTransactionType = (amount: number): string => {
    // Negative amounts are payments/credits (reduce balance)
    // Positive amounts are purchases/debits (increase balance)
    return amount < 0 ? 'Payment' : 'Purchase';
  };

  const getTransactionTypeColor = (amount: number): string => {
    return amount < 0 
      ? 'text-green-600 dark:text-green-400' 
      : 'text-red-600 dark:text-red-400';
  };

  // Zone order for sorting (Safe -> Caution -> Danger)
  const zoneOrder: { [key: string]: number } = { 'Safe': 1, 'Caution': 2, 'Danger': 3 };

  const columns: Column<Transaction>[] = useMemo(() => [
    {
      key: 'zone',
      header: 'Zone',
      sortable: true,
      sortFn: (a, b, direction) => {
        const aZone = a.zone || 'Unknown';
        const bZone = b.zone || 'Unknown';
        const comparison = (zoneOrder[aZone] || 999) - (zoneOrder[bZone] || 999);
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
            {row.zone || 'N/A'}
          </span>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      sortable: true,
      sortFn: (a, b, direction) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return direction === 'asc' ? dateA - dateB : dateB - dateA;
      },
      render: (row) => (
        <span className="text-sm text-gray-900 dark:text-white">
          {formatDate(row.date)}
        </span>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      sortable: true,
      render: (row) => (
        <div className="max-w-xs">
          <p className="truncate text-sm text-gray-900 dark:text-white">
            {row.description}
          </p>
          {row.category && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {row.category}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      sortable: true,
      sortFn: (a, b, direction) => {
        const comparison = Math.abs(a.amount) - Math.abs(b.amount);
        return direction === 'asc' ? comparison : -comparison;
      },
      render: (row) => (
        <div className="text-left">
          <p className={`text-sm font-medium ${getTransactionTypeColor(row.amount)}`}>
            {row.amount < 0 ? '-' : '+'}{formatCurrency(row.amount)}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {getTransactionType(row.amount)}
          </p>
        </div>
      ),
    },
    {
      key: 'balance',
      header: 'Balance',
      sortable: true,
      sortFn: (a, b, direction) => {
        const balanceA = a.balance || 0;
        const balanceB = b.balance || 0;
        return direction === 'asc' ? balanceA - balanceB : balanceB - balanceA;
      },
      render: (row) => (
        <span className="text-sm text-gray-900 dark:text-white">
          {row.balance !== undefined ? formatCurrency(row.balance) : 'N/A'}
        </span>
      ),
    },
    {
      key: 'utilizationPercentage',
      header: 'Utilization',
      sortable: true,
      sortFn: (a, b, direction) => {
        const utilA = a.utilizationPercentage || 0;
        const utilB = b.utilizationPercentage || 0;
        return direction === 'asc' ? utilA - utilB : utilB - utilA;
      },
      render: (row) => (
        <span className="text-sm text-gray-900 dark:text-white">
          {row.utilizationPercentage !== undefined
            ? row.utilizationPercentage < 1
              ? '<1%'
              : `${row.utilizationPercentage.toFixed(1)}%`
            : 'N/A'}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      sortable: false,
      render: (row) => (
        <button 
          onClick={() => handleViewNote(row)}
          className="text-sm text-gray-900 underline hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
        >
          View Details
        </button>
      ),
    },
  ], [selectedRows]);

  return (
    <>
      <DataTable columns={columns} data={data} />
      <TransactionInsightModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        transaction={selectedTransaction}
        card={card}
      />
    </>
  );
}
