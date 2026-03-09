/**
 * CardOffersSkeleton
 * Loading skeleton for the offers page
 */

'use client';

export function CardOffersSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Filter chips skeleton */}
      <div className="flex items-center gap-2 flex-wrap">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-8 rounded-full bg-gray-200 dark:bg-gray-800"
            style={{ width: `${60 + i * 10}px` }}
          />
        ))}
        <div className="flex-1" />
        <div className="h-8 w-32 rounded-full bg-gray-200 dark:bg-gray-800" />
      </div>

      {/* Result count */}
      <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-800" />

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden"
          >
            {/* Card visual placeholder */}
            <div className="p-4 pb-3">
              <div className="w-full aspect-[1.586/1] rounded-xl bg-gray-200 dark:bg-gray-700" />
            </div>
            {/* Name + issuer */}
            <div className="px-4 pb-3 flex flex-col gap-1.5">
              <div className="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-800" />
              <div className="h-3 w-1/3 rounded bg-gray-100 dark:bg-gray-800" />
            </div>
            {/* Metrics row */}
            <div className="mx-4 mb-3 grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-800 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex flex-col items-center py-2.5 px-1 gap-1.5">
                  <div className="h-2.5 w-14 rounded bg-gray-200 dark:bg-gray-800" />
                  <div className="h-4 w-10 rounded bg-gray-300 dark:bg-gray-700" />
                </div>
              ))}
            </div>
            {/* Body */}
            <div className="px-4 flex flex-col gap-3 flex-1">
              <div className="h-14 rounded-lg bg-gray-100 dark:bg-gray-800" />
              <div className="space-y-2">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-start gap-2">
                    <div className="h-3.5 w-3.5 rounded-full bg-gray-200 dark:bg-gray-800 flex-shrink-0 mt-0.5" />
                    <div
                      className="h-3 rounded bg-gray-200 dark:bg-gray-800"
                      style={{ width: `${70 + j * 5}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
            {/* Footer buttons */}
            <div className="flex gap-2 p-4 mt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="h-9 w-24 rounded-lg bg-gray-200 dark:bg-gray-800" />
              <div className="flex-1 h-9 rounded-lg bg-gray-300 dark:bg-gray-700" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
