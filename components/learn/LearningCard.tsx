/**
 * Learning Card Component
 * Reusable card for displaying learning content (videos, articles, guides)
 */

'use client';

import { Play, Clock, BookOpen, Video as VideoIcon } from 'lucide-react';
import type { LearningContent } from '@/types/learn.types';
import { Skeleton } from '@/components/ui/Skeleton';

interface LearningCardProps {
  content: LearningContent;
  onClick?: () => void;
}

export function LearningCard({ content, onClick }: LearningCardProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Intermediate':
        return 'border-[#EC4899] text-[#EC4899]';
      case 'Advanced':
        return 'border-purple-500 text-purple-500';
      default:
        return 'border-brand text-brand';
    }
  };

  return (
    <div
      className="group flex h-[250px] cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-200 bg-background transition-colors hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700 sm:h-[370px]"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative h-[52%] flex-shrink-0 bg-gray-300 dark:bg-gray-800/60">
        {content.thumbnailUrl && (
          <img
            src={content.thumbnailUrl}
            alt={content.title}
            className="h-full w-full object-cover"
          />
        )}
        {/* Placeholder icon when no thumbnail */}
        {!content.thumbnailUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            {content.type === 'video' ? (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                <Play className="ml-0.5 h-10 w-10 text-gray-400 dark:text-gray-500" />
              </div>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 dark:bg-gray-700">
                <BookOpen className="h-10 w-10 text-gray-400 dark:text-gray-500" />
              </div>
            )}
          </div>
        )}
        {/* Play overlay for video with thumbnail */}
        {content.thumbnailUrl && content.type === 'video' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/40 bg-black/30 shadow-xl backdrop-blur-md transition-all duration-300 group-hover:scale-110">
              <Play className="ml-0.5 h-10 w-10 fill-none stroke-[2.5] text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="flex min-h-0 flex-1 flex-col p-4">
        {/* Type label */}
        <div className="mb-2 flex items-center gap-1.5">
          {content.type === 'video' ? (
            <>
              <VideoIcon className="h-3.5 w-3.5 text-brand" />
              <span className="text-xs font-semibold uppercase tracking-wider text-brand">Video</span>
            </>
          ) : (
            <>
              <BookOpen className="h-3.5 w-3.5 text-brand" />
              <span className="text-xs font-semibold uppercase tracking-wider text-brand">Article</span>
            </>
          )}
        </div>
        <h3 className="mb-1 line-clamp-2 text-base font-semibold leading-snug text-gray-900 transition-colors group-hover:text-brand dark:text-white">
          {content.title}
        </h3>
        <p className="mb-3 line-clamp-2 flex-1 text-sm text-gray-500 dark:text-gray-400">
          {content.description}
        </p>
        <div className="flex items-center justify-between">
          <span
            className={`rounded-full border-2 px-3 py-0.5 text-xs font-medium ${getCategoryColor(content.category)}`}
          >
            {content.category}
          </span>
          <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <Clock className="h-3 w-3" />
            <span>{content.duration}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LearningCardSkeleton() {
  return (
    <div className="flex h-[300px] flex-col overflow-hidden rounded-2xl border border-transparent">
      <Skeleton className="h-36 flex-shrink-0 rounded-none rounded-t-2xl" />
      <div className="flex flex-1 flex-col p-4">
        <Skeleton className="mb-2 h-3 w-12" />
        <Skeleton className="mb-1 h-5 w-3/4" />
        <Skeleton className="h-4 w-full mb-1" />
        <Skeleton className="h-4 w-2/3 mb-3 flex-1" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}