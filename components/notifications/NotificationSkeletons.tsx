'use client';

import { Skeleton } from '@/components/ui/Skeleton';

export function NotificationsPageSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl bg-white dark:bg-black">
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="rounded-lg px-1 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-2 w-2 rounded-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
                <Skeleton className="mt-2 h-3 w-11/12" />
              </div>
              <div className="shrink-0 space-y-2 text-right">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="ml-auto h-3 w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NotificationDropdownSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="p-2">
      <div className="space-y-1">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="rounded-lg px-3 py-3">
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-4 w-3/5" />
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-2 w-2 rounded-full" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
            <Skeleton className="mt-2 h-3 w-11/12" />
            <Skeleton className="mt-2 h-3 w-2/5" />
          </div>
        ))}
      </div>
    </div>
  );
}