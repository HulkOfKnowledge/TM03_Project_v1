/**
 * Credit Analysis Skeleton
 * Loading state for the credit analysis page
 */

'use client';

import { Skeleton } from '@/components/ui/Skeleton';

export function CreditAnalysisSkeleton() {
  return (
    <div className="mx-auto">
      <div className="mb-6 sm:mb-8">
        <div className="mb-3 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1">
            <Skeleton className="mb-1.5 h-9 w-56" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
          <Skeleton className="h-10 w-52" />
        </div>
        <Skeleton className="h-8 w-72" />
      </div>

      {/* Top Metrics */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 sm:p-6">
          <div className="mb-3 flex items-start justify-between">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-4" />
          </div>
          <Skeleton className="mb-2 h-9 w-44" />
          <Skeleton className="h-3 w-36" />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 sm:p-6">
          <div className="mb-3 flex items-start justify-between">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-4" />
          </div>
          <Skeleton className="mb-2 h-9 w-44" />
          <Skeleton className="h-3 w-36" />
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 sm:p-6 lg:col-span-2">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-shrink-0">
              <Skeleton className="mb-2 h-4 w-24" />
              <Skeleton className="mb-2 h-9 w-28" />
              <Skeleton className="h-6 w-full max-w-xs" />
            </div>
            <div className="flex flex-wrap items-center gap-4 sm:gap-0">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="flex items-center">
                  {index > 0 && (
                    <div className="mx-4 hidden h-12 w-px bg-gray-200 dark:bg-gray-800 sm:block sm:mx-6 sm:h-16" />
                  )}
                  <div className="flex flex-col items-center">
                    <Skeleton className="mb-1 h-3 w-20" />
                    <Skeleton className="h-8 w-28 sm:h-10" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Overall Utilization Rate */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 sm:mb-8 sm:p-6">
        <div className="mb-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="mb-4 h-px w-full bg-gray-200 dark:bg-gray-800"></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_auto_1fr] sm:items-center">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <Skeleton className="h-12 w-32" />
                <Skeleton className="h-6 w-32" />
              </div>
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </div>
        <div className="h-64 sm:h-80">
          <Skeleton className="h-full w-full" />
        </div>
      </div>

      {/* Spending Patterns */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 sm:mb-8 sm:p-6">
        <div className="mb-6">
          <div className="mb-4 flex items-start justify-between gap-4">
            <Skeleton className="h-6 w-44" />
            <Skeleton className="h-8 w-24" />
          </div>
          <div className="mb-4 h-px w-full bg-gray-200 dark:bg-gray-800"></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_auto_1fr] sm:items-center">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <Skeleton className="h-12 w-40" />
                <Skeleton className="h-6 w-32" />
              </div>
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
        <div className="h-64 sm:h-80">
          <Skeleton className="h-full w-full" />
        </div>
      </div>

      {/* Payment History */}
      <div className="mb-6 sm:mb-8">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-6 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
        <div className="relative mb-4">
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
          <div className="space-y-3">
            {[...Array(6)].map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        </div>
      </div>

      {/* Recommended Actions */}
      <div className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 sm:mt-8 sm:p-6 lg:grid-cols-2 lg:gap-6">
        <div>
          <Skeleton className="mb-2 h-7 w-52" />
          <Skeleton className="mb-6 h-4 w-full max-w-md" />
          <Skeleton className="mb-6 h-5 w-full" />
          {[...Array(3)].map((_, index) => (
            <div key={index} className="mb-3 flex items-start gap-3 sm:mb-4">
              <Skeleton className="h-10 w-10 rounded-full sm:h-12 sm:w-12" />
              <div className="flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
        <div className="hidden rounded-lg bg-gray-100 dark:bg-gray-900 lg:block" />
      </div>
    </div>
  );
}
