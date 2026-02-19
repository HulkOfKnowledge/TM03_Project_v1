/**
 * PaymentHistoryTable Component
 * Displays payment history with search and filters
 */

'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { DataTable, Column } from '@/components/ui/DataTable';
import type { PaymentHistoryRow } from '@/types/card.types';

interface PaymentHistoryTableProps {
  data: PaymentHistoryRow[];
  title?: string;
  subtitle?: string;
}

export function PaymentHistoryTable({
  data,
  title = 'Payment History',
  subtitle,
}: PaymentHistoryTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  
  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Extract unique years from the data
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    data.forEach(row => {
      const yearMatch = row.month.match(/\d{4}/);
      if (yearMatch) {
        years.add(yearMatch[0]);
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a)); // Sort descending
  }, [data]);

  // Extract unique payment statuses
  const availableStatuses = useMemo(() => {
    const statuses = new Set<string>();
    data.forEach(row => {
      statuses.add(row.paymentStatus);
    });
    return Array.from(statuses).sort();
  }, [data]);

  // Filter data based on search query, year, and status
  const filteredData = useMemo(() => {
    return data.filter(row => {
      // Search filter - searches in month, cardName, paymentStatus, and alerts
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        row.month.toLowerCase().includes(searchLower) ||
        row.cardName?.toLowerCase().includes(searchLower) ||
        row.paymentStatus.toLowerCase().includes(searchLower) ||
        row.alerts.toLowerCase().includes(searchLower);

      // Year filter
      const matchesYear = !selectedYear || row.month.includes(selectedYear);

      // Status filter
      const matchesStatus = !selectedStatus || row.paymentStatus === selectedStatus;

      return matchesSearch && matchesYear && matchesStatus;
    });
  }, [data, searchQuery, selectedYear, selectedStatus]);

  const columns: Column<PaymentHistoryRow>[] = useMemo(() => [
    {
      key: 'month',
      header: 'Month',
      sortable: true,
    },
    {
      key: 'cardName',
      header: 'Card',
      sortable: true,
      render: (row) => row.cardName || '-',
    },
    {
      key: 'statementBalance',
      header: 'Statement Balance',
      sortable: true,
      render: (row) => formatCurrency(row.statementBalance),
    },
    {
      key: 'amountPaid',
      header: 'Amount Paid',
      sortable: true,
      render: (row) => formatCurrency(row.amountPaid),
    },
    {
      key: 'paymentStatus',
      header: 'Payment Status',
      sortable: true,
      render: (row) => (
        <span
          className={`${
            row.paymentStatus === 'Late'
              ? 'text-gray-400 dark:text-gray-500'
              : 'text-gray-900 dark:text-white'
          }`}
        >
          {row.paymentStatus}
        </span>
      ),
    },
    {
      key: 'peakUsage',
      header: 'Peak Usage',
      sortable: true,
      className: 'text-gray-500 dark:text-gray-400',
      render: (row) => `${row.utilizationPercentage.toFixed(1)}%`,
    },
    {
      key: 'alerts',
      header: 'Alerts',
      sortable: true,
      render: (row) => {
        const alert = row.alerts;
        let colorClass = 'text-gray-600 dark:text-gray-400';
        
        if (alert.includes('High')) {
          colorClass = 'text-red-600 dark:text-red-400 font-medium';
        } else if (alert.includes('Caution')) {
          colorClass = 'text-yellow-600 dark:text-yellow-400 font-medium';
        } else if (alert.includes('Safe')) {
          colorClass = 'text-green-600 dark:text-green-400';
        }
        
        return <span className={colorClass}>{alert}</span>;
      },
    },
  ], []);

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
        <div className="flex gap-2">
          {/* Year Filter */}
          <select
            value={selectedYear || ''}
            onChange={(e) => setSelectedYear(e.target.value || null)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:hover:bg-gray-900 sm:px-4 sm:text-sm"
          >
            <option value="">All Years</option>
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          
          {/* Status Filter */}
          <select
            value={selectedStatus || ''}
            onChange={(e) => setSelectedStatus(e.target.value || null)}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:hover:bg-gray-900 sm:px-4 sm:text-sm"
          >
            <option value="">All Status</option>
            {availableStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
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

      {/* Table */}
      <DataTable columns={columns} data={filteredData} />
    </div>
  );
}
