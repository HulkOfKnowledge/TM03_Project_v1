/**
 * Testimonial Skeleton Component
 * Reusable loading skeleton for testimonials
 */

'use client';

import { Skeleton } from '@/components/ui/Skeleton';

export function TestimonialSkeleton() {
  return (
    <div className="bg-white dark:bg-[#1A1A1A] rounded-3xl overflow-hidden">
      <div className="grid lg:grid-cols-2">
        <div className="p-8 md:p-12 space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="flex items-center justify-between pt-6">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-2 w-8 rounded-full" />
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-2 w-2 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
          </div>
        </div>
        <div className="relative aspect-[4/3] lg:aspect-auto">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}
