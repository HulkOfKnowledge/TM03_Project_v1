/**
 * MetricCard Component
 * Reusable card for displaying credit metrics
 */

'use client';

import { Info, ChevronUp, ChevronDown } from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  description?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  showInfo?: boolean;
  fullWidth?: boolean;
}

export function MetricCard({
  label,
  value,
  description,
  trend,
  showInfo = false,
  fullWidth = false,
}: MetricCardProps) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 sm:p-6 ${
        fullWidth ? 'col-span-full' : ''
      }`}
    >
      <div className="mb-3 flex items-start justify-between">
        <span className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
          {label}
        </span>
        {showInfo && (
          <Info className="h-3 w-3 flex-shrink-0 text-gray-400 dark:text-gray-600 sm:h-4 sm:w-4" />
        )}
      </div>
      <p className="mb-2 text-3xl text-gray-900 dark:text-white sm:text-4xl md:text-5xl">
        {value}
      </p>
      {trend && (
        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-500">
          {trend.isPositive ? (
            <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
          ) : (
            <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4" />
          )}
          <span className="text-xs sm:text-sm">{trend.value}</span>
        </div>
      )}
      {description && !trend && (
        <p className="text-xs text-gray-500 dark:text-gray-500 sm:text-sm">
          {description}
        </p>
      )}
    </div>
  );
}
