/**
 * Video Preview Skeleton Component
 * Loading state for video layout
 */

import { Skeleton } from '@/components/ui/Skeleton';

export function VideoPreviewSkeleton() {
  return (
    <div className="bg-background pb-12">
      {/* Back Navigation + Tabs Skeleton */}
      <div className="mx-auto">
        <div className="flex flex-wrap items-center gap-4">
          {/* Back Button Skeleton */}
          <Skeleton className="h-10 w-10 rounded-full" />

          {/* Tabs Skeleton */}
          <div className="inline-flex gap-2 rounded-lg bg-muted p-1">
            <Skeleton className="h-10 w-24 rounded-md md:w-32" />
            <Skeleton className="h-10 w-24 rounded-md md:w-32" />
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="mx-auto mt-8">
        <div className="grid items-stretch gap-5 lg:h-[420px] lg:grid-cols-[30%_70%]">
          {/* Left Column - Video Card Skeleton */}
          <Skeleton className="h-[300px] rounded-2xl lg:h-full" />

          {/* Right Column - Video Preview Skeleton */}
          <Skeleton className="h-[300px] rounded-2xl lg:h-full" />
        </div>

        {/* Lesson Description Skeleton */}
        <div className="mt-12 space-y-3 lg:mt-16">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        {/* What You'll Learn Section Skeleton */}
        <div className="mt-12 lg:mt-16">
          <Skeleton className="mb-6 h-8 w-48 md:mb-8" />
          <div className="space-y-3 md:space-y-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded-lg p-3 md:gap-4 md:p-0"
              >
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 flex-1" />
              </div>
            ))}
          </div>
        </div>

        {/* Begin Lesson Button Skeleton */}
        <div className="mt-8 max-w-3xl md:mt-12">
          <Skeleton variant="button" className="w-40" />
        </div>
      </div>
    </div>
  );
}
