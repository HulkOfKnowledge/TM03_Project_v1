'use client';

import { Skeleton } from '@/components/ui/Skeleton';

export function SmartForecastSkeleton() {
  return (
    <div className="mx-auto">
      <div className="mb-6 sm:mb-8">
        <div className="mb-3 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1">
            <Skeleton className="mb-1.5 h-9 w-64" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-8 w-72" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-3">
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 sm:mb-8 sm:p-6">
        <Skeleton className="mb-4 h-6 w-56" />
        <Skeleton className="mb-6 h-4 w-full max-w-2xl" />
        <Skeleton className="h-64 w-full rounded-lg sm:h-80" />
      </div>

      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 sm:mb-8 sm:p-6">
        <Skeleton className="mb-4 h-6 w-56" />
        <Skeleton className="mb-6 h-4 w-full max-w-2xl" />
        <Skeleton className="h-64 w-full rounded-lg sm:h-80" />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-950 sm:p-6">
        <Skeleton className="mb-4 h-6 w-56" />
        <Skeleton className="mb-6 h-4 w-full max-w-2xl" />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 w-full rounded-lg sm:h-80" />
          <Skeleton className="h-64 w-full rounded-lg sm:h-80" />
        </div>
      </div>
    </div>
  );
}
