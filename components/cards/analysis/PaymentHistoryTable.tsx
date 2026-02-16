/**
 * PaymentHistoryTable Component
 * Displays payment history with search and filters
 */

'use client';

import { Search, ChevronUp } from 'lucide-react';

interface PaymentHistoryRow {
  month: string;
  statementBalance: string;
  amountPaid: string;
  paymentStatus: string;
  peakUsage: string;
  alerts: string;
}

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
  return (
    <div>
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
          <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900 sm:px-4 sm:text-sm">
            2025
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900 sm:px-4 sm:text-sm">
            Filter
            <svg
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, transaction, anything"
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white dark:placeholder-gray-500"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 text-left text-xs dark:bg-gray-900 sm:text-sm">
              <th className="px-3 py-3 font-medium text-gray-700 dark:text-gray-300 sm:px-4">
                <div className="flex items-center gap-1.5">
                  Month
                  <ChevronUp className="h-3 w-3" />
                </div>
              </th>
              <th className="px-3 py-3 font-medium text-gray-700 dark:text-gray-300 sm:px-4">
                Statement Balance
              </th>
              <th className="px-3 py-3 font-medium text-gray-700 dark:text-gray-300 sm:px-4">
                Amount Paid
              </th>
              <th className="px-3 py-3 font-medium text-gray-700 dark:text-gray-300 sm:px-4">
                Payment Status
              </th>
              <th className="px-3 py-3 font-medium text-gray-700 dark:text-gray-300 sm:px-4">
                Peak Usage
              </th>
              <th className="px-3 py-3 font-medium text-gray-700 dark:text-gray-300 sm:px-4">
                Alerts
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-950">
            {data.map((row, index) => (
              <tr
                key={index}
                className="border-b border-gray-200 transition-colors last:border-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/50"
              >
                <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-900 dark:text-white sm:px-4 sm:py-4 sm:text-sm">
                  {row.month}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-900 dark:text-white sm:px-4 sm:py-4 sm:text-sm">
                  {row.statementBalance}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-900 dark:text-white sm:px-4 sm:py-4 sm:text-sm">
                  {row.amountPaid}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-xs sm:px-4 sm:py-4 sm:text-sm">
                  <span
                    className={`${
                      row.paymentStatus === 'Late'
                        ? 'text-gray-400 dark:text-gray-500'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {row.paymentStatus}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-500 dark:text-gray-400 sm:px-4 sm:py-4 sm:text-sm">
                  {row.peakUsage}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-xs text-gray-900 dark:text-white sm:px-4 sm:py-4 sm:text-sm">
                  {row.alerts}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
