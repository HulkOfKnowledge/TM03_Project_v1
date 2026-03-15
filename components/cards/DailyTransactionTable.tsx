/**
 * Daily Transaction Table Component
 * Displays daily transaction history with sorting, zones, and action column
 */

'use client';

import { useMemo, useState, useEffect } from 'react';
import type { Transaction, ConnectedCard } from '@/types/card.types';
import { TransactionInsightModal } from './TransactionInsightModal';
import { MobileTransactionList } from './MobileTransactionList';
import { PaginationControls } from '@/components/ui/PaginationControls';
import {
  formatCurrency,
  formatDate,
  getTransactionType,
  getTransactionTypeColor,
  getZoneColor,
  zoneOrder,
} from './transaction-utils';

interface DailyTransactionTableProps {
  data: Transaction[];
  card: ConnectedCard;
}

export function DailyTransactionTable({ data, card }: DailyTransactionTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortField, setSortField] = useState<string | null>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

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

  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortDirection(null);
        setSortField(null);
      } else {
        setSortDirection('asc');
      }
      return;
    }

    setSortField(field);
    setSortDirection('asc');
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field || !sortDirection) return null;
    return <span className="text-xs text-gray-500 dark:text-gray-400">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  const getDateValue = (dateValue: string) => {
    const [year, month, day] = dateValue.split('-').map(Number);
    return new Date(year, month - 1, day).getTime();
  };

  const sortedData = useMemo(() => {
    const next = [...data];

    if (!sortField || !sortDirection) return next;

    next.sort((a, b) => {
      switch (sortField) {
        case 'zone': {
          const aZone = a.zone || 'Unknown';
          const bZone = b.zone || 'Unknown';
          const comparison = (zoneOrder[aZone] || 999) - (zoneOrder[bZone] || 999);
          return sortDirection === 'asc' ? comparison : -comparison;
        }
        case 'date': {
          const comparison = getDateValue(a.date) - getDateValue(b.date);
          return sortDirection === 'asc' ? comparison : -comparison;
        }
        case 'description': {
          const comparison = a.description.localeCompare(b.description);
          return sortDirection === 'asc' ? comparison : -comparison;
        }
        case 'amount': {
          const comparison = Math.abs(a.amount) - Math.abs(b.amount);
          return sortDirection === 'asc' ? comparison : -comparison;
        }
        case 'balance': {
          const comparison = (a.balance || 0) - (b.balance || 0);
          return sortDirection === 'asc' ? comparison : -comparison;
        }
        case 'utilizationPercentage': {
          const comparison = (a.utilizationPercentage || 0) - (b.utilizationPercentage || 0);
          return sortDirection === 'asc' ? comparison : -comparison;
        }
        default:
          return 0;
      }
    });

    return next;
  }, [data, sortDirection, sortField]);

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * pageSize;
  const paginatedTransactions = sortedData.slice(pageStart, pageStart + pageSize);

  return (
    <>
      <div className="rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="md:hidden">
          <MobileTransactionList data={paginatedTransactions} onViewDetails={handleViewNote} />
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 text-left text-xs dark:bg-gray-900 sm:text-sm">
                <th
                  className="cursor-pointer px-3 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 sm:px-4"
                  onClick={() => handleSort('zone')}
                >
                  <div className="flex items-center gap-2">Zone {getSortIcon('zone')}</div>
                </th>
                <th
                  className="cursor-pointer px-3 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 sm:px-4"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-2">Date {getSortIcon('date')}</div>
                </th>
                <th
                  className="cursor-pointer px-3 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 sm:px-4"
                  onClick={() => handleSort('description')}
                >
                  <div className="flex items-center gap-2">Description {getSortIcon('description')}</div>
                </th>
                <th
                  className="cursor-pointer px-3 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 sm:px-4"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center gap-2">Amount {getSortIcon('amount')}</div>
                </th>
                <th
                  className="cursor-pointer px-3 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 sm:px-4"
                  onClick={() => handleSort('balance')}
                >
                  <div className="flex items-center gap-2">Balance {getSortIcon('balance')}</div>
                </th>
                <th
                  className="cursor-pointer px-3 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 sm:px-4"
                  onClick={() => handleSort('utilizationPercentage')}
                >
                  <div className="flex items-center gap-2">Utilization {getSortIcon('utilizationPercentage')}</div>
                </th>
                <th className="px-3 py-3 font-medium text-gray-700 dark:text-gray-300 sm:px-4">Action</th>
              </tr>
            </thead>

            <tbody className="bg-white dark:bg-gray-950">
              {paginatedTransactions.map((row, index) => (
                <tr
                  key={pageStart + index}
                  className="border-b border-gray-200 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/50"
                >
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-900 dark:text-white sm:px-4 sm:py-4 sm:text-sm">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(pageStart + index)}
                        onChange={() => toggleRow(pageStart + index)}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className={`inline-block rounded px-3 py-1 text-xs font-medium ${getZoneColor(row.zone)}`}>
                        {row.zone || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-900 dark:text-white sm:px-4 sm:py-4 sm:text-sm">
                    {formatDate(row.date)}
                  </td>
                  <td className="px-3 py-3 text-xs text-gray-900 dark:text-white sm:px-4 sm:py-4 sm:text-sm">
                    <div className="max-w-xs">
                      <p className="truncate">{row.description}</p>
                      {row.category && <p className="text-xs text-gray-500 dark:text-gray-400">{row.category}</p>}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-900 dark:text-white sm:px-4 sm:py-4 sm:text-sm">
                    <div>
                      <p className={`font-medium ${getTransactionTypeColor(row.amount)}`}>
                        {row.amount < 0 ? '-' : '+'}
                        {formatCurrency(row.amount)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{getTransactionType(row.amount)}</p>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-900 dark:text-white sm:px-4 sm:py-4 sm:text-sm">
                    {row.balance !== undefined ? formatCurrency(row.balance) : 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-900 dark:text-white sm:px-4 sm:py-4 sm:text-sm">
                    {row.utilizationPercentage !== undefined
                      ? row.utilizationPercentage < 1
                        ? '<1%'
                        : `${row.utilizationPercentage.toFixed(1)}%`
                      : 'N/A'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-900 dark:text-white sm:px-4 sm:py-4 sm:text-sm">
                    <button
                      onClick={() => handleViewNote(row)}
                      className="text-sm text-gray-900 underline hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
                    >
                      View Details
                    </button>
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

      <TransactionInsightModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        transaction={selectedTransaction}
        card={card}
      />
    </>
  );
}
