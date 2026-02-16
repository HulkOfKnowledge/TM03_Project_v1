/**
 * Resource Card Component
 * Reusable card for displaying downloadable resources and videos
 */

'use client';

import { Skeleton } from '@/components/ui/Skeleton';

export interface Resource {
  id: string;
  title: string;
  type: 'document' | 'video';
  category?: string;
  itemCount?: number;
  thumbnailUrl?: string;
  url?: string;
}

interface ResourceCardProps {
  resource: Resource;
  onClick?: () => void;
}

export function ResourceCard({ resource, onClick }: ResourceCardProps) {
  const isDocument = resource.type === 'document';

  return (
    <div
      onClick={onClick}
      className="group grid grid-cols-2 gap-0 overflow-hidden rounded-lg bg-gray-100 transition-all hover:bg-gray-200 dark:bg-gray-900 dark:hover:bg-gray-800 cursor-pointer min-h-[200px] sm:min-h-[240px]"
    >
      {/* Left: Content */}
      <div className="flex flex-col justify-between p-4 sm:p-6">
        <div>
          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-normal mb-2 sm:mb-3 block">
            {resource.category || (isDocument ? 'Documents' : 'Videos')}
          </span>
          <h3 className="text-lg sm:text-xl md:text-2xl text-gray-900 dark:text-white leading-tight">
            {resource.title}
          </h3>
        </div>

        {/* Explore Link at bottom */}
        <button className="flex items-center gap-1.5 text-sm sm:text-base font-normal text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors self-start underline mt-4">
          Explore
        </button>
      </div>

      {/* Right: Image Placeholder */}
      <div className="relative bg-white/40 dark:bg-gray-950/40 flex items-center justify-center overflow-hidden">
        {resource.thumbnailUrl ? (
          <img
            src={resource.thumbnailUrl}
            alt={resource.title}
            className="h-full w-full object-cover opacity-20"
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(0,0,0,0.02)_25%,rgba(0,0,0,0.02)_50%,transparent_50%,transparent_75%,rgba(0,0,0,0.02)_75%)] dark:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_25%,rgba(255,255,255,0.02)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.02)_75%)] bg-[length:20px_20px]" />
        )}
      </div>
    </div>
  );
}

export function ResourceCardSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900 min-h-[200px] sm:min-h-[240px]">
      <div className="flex flex-col justify-between p-4 sm:p-6">
        <div>
          <Skeleton className="h-3 w-20 mb-2 sm:mb-3" />
          <Skeleton className="h-6 w-full mb-2" />
          <Skeleton className="h-6 w-4/5" />
        </div>
        <Skeleton className="h-4 w-16 mt-4" />
      </div>
      <Skeleton className="w-full h-full" />
    </div>
  );
}
