/**
 * Resource Card Component
 * Reusable card for displaying downloadable resources and videos
 */

'use client';

import { FileText, Video, ArrowRight } from 'lucide-react';
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
  const Icon = isDocument ? FileText : Video;

  return (
    <div
      onClick={onClick}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white transition-all hover:border-gray-300 hover:shadow-md dark:border-gray-800 dark:bg-black dark:hover:border-gray-700 cursor-pointer"
    >
      {/* Thumbnail/Icon Area */}
      <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
        {resource.thumbnailUrl ? (
          <img
            src={resource.thumbnailUrl}
            alt={resource.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
            <Icon className="h-16 w-16 text-gray-400 dark:text-gray-600" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2 block">
            {resource.category || (isDocument ? 'Documents' : 'Videos')}
          </span>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-brand transition-colors">
            {resource.title}
          </h3>
        </div>

        {/* Action Button */}
        <button className="mt-4 flex items-center justify-center gap-2 text-sm font-medium text-brand hover:underline">
          Explore
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function ResourceCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800">
      <Skeleton className="aspect-[4/3]" />
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-5 w-full mb-1" />
          <Skeleton className="h-5 w-3/4" />
        </div>
        <Skeleton className="h-4 w-24 mt-4" />
      </div>
    </div>
  );
}
