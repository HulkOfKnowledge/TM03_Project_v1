/**
 * Card Overview Skeleton
 * Loading state for the card dashboard
 */

'use client';

import { Skeleton } from '@/components/ui/Skeleton';

export function CardOverviewSkeleton() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
        <div className="flex-1">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-full max-w-2xl" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Description Box */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 md:p-6 mb-8 border border-gray-200 dark:border-gray-800">
        <Skeleton className="h-6 w-32 mb-3" />
        <div className="flex flex-wrap gap-2 mb-4">
          <Skeleton className="h-6 w-24 rounded" />
          <Skeleton className="h-6 w-28 rounded" />
          <Skeleton className="h-6 w-32 rounded" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>

      {/* Card Display */}
      <div className="mb-8">
        <div className="relative max-w-2xl mx-auto">
          <div className="perspective-1000">
            {/* Card Skeleton */}
            <Skeleton className="w-full aspect-[1.586/1] rounded-2xl" />
          </div>

          {/* Card Status */}
          <div className="text-center mt-8">
            <Skeleton className="h-5 w-48 mx-auto mb-1" />
            <Skeleton className="h-4 w-64 mx-auto mb-4" />
            
            {/* Progress Bar */}
            <Skeleton className="h-12 max-w-2xl mx-auto mb-2 rounded" />
            <div className="flex justify-between max-w-2xl mx-auto px-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-8 w-24 mb-1" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      </div>

      {/* History Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <Skeleton className="h-7 w-24 mb-1" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-8 w-40" />
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <Skeleton className="flex-1 h-11 rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-11 w-20 rounded-lg" />
            <Skeleton className="h-11 w-20 rounded-lg" />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
          <div className="bg-white dark:bg-gray-950 p-4">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="flex gap-4 py-3 border-b border-gray-200 dark:border-gray-800 last:border-0">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
