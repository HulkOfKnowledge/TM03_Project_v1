/**
 * ChartSection Component
 * Reusable wrapper for chart displays with consistent styling
 */

'use client';

import { ReactNode } from 'react';
import { ChevronUp } from 'lucide-react';

interface ChartSectionProps {
  title: string;
  children: ReactNode;
  primaryValue?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  trend?: {
    value: string;
    label?: string;
  };
  legend?: Array<{
    color: string;
    label: string;
  }>;
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
  periodOptions?: string[];
}

export function ChartSection({
  title,
  children,
  primaryValue,
  primaryLabel,
  secondaryLabel,
  trend,
  legend,
  selectedPeriod,
  onPeriodChange,
  periodOptions = ['Yearly', 'Monthly', 'Last 3 months'],
}: ChartSectionProps) {
  return (
    <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 sm:mb-8 sm:p-6">
      <div className="mb-6">
        {/* Title */}
        <h2 className="mb-4 text-base text-gray-700 dark:text-gray-300 sm:text-lg">
          {title}
        </h2>

        {/* Separator */}
        <div className="mb-4 h-px w-full bg-gray-200 dark:bg-gray-800"></div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_auto_1fr] sm:items-center">
          {/* Left: Primary value */}
          {primaryValue && (
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="text-4xl text-gray-900 dark:text-white sm:text-5xl">
                  {primaryValue
                    ? Math.round(
                        parseFloat(primaryValue.replace(/[^0-9.-]+/g, ''))
                      ).toLocaleString()
                    : ''}
                </span>
                {trend && (
                  <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500">
                    <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-800 sm:text-sm">
                      {trend.value}
                    </span>
                  </div>
                )}
              </div>
              {primaryLabel && (
                <span className="text-xs text-gray-500 dark:text-gray-500 sm:text-sm">
                  {primaryLabel}
                </span>
              )}
              {secondaryLabel && (
                <span className="block text-xs text-gray-500 dark:text-gray-500 sm:text-sm">
                  {secondaryLabel}
                </span>
              )}
            </div>
          )}

          {/* Middle: Legend */}
          {legend && legend.length > 0 && (
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="h-16 w-px bg-gray-200 dark:bg-gray-800"></div>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                {legend.map((item, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <div
                      className="h-2 w-2 rounded-full sm:h-3 sm:w-3"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Right: Dropdown */}
          <div className="flex justify-end">
            <select
              value={selectedPeriod}
              onChange={(e) => onPeriodChange(e.target.value)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-800 dark:bg-gray-950 dark:text-white sm:text-sm"
            >
              {periodOptions.map((option) => (
                <option key={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 sm:h-80">{children}</div>
    </div>
  );
}
