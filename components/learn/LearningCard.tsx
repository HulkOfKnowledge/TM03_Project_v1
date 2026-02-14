/**
 * Learning Card Component
 * Reusable card for displaying learning content (videos, articles, guides)
 */

'use client';

import { Play } from 'lucide-react';
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

  const getThumbnailBg = () => {
    if (content.thumbnailUrl) return '';
    const colors = ['bg-gray-200 dark:bg-gray-700', 'bg-pink-100 dark:bg-pink-900/30', 'bg-blue-100 dark:bg-blue-900/30'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <div className="group flex h-full min-h-[200px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-gray-200 bg-background transition-colors hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700" onClick={onClick}>
      <div
        className={`relative aspect-video ${getThumbnailBg()}`}
      >
        {content.thumbnailUrl ? (
          <>
            <img
              src={content.thumbnailUrl}
              alt={content.title}
              className="h-full w-full object-cover"
            />
            {/* Play button overlay for videos only */}
            {content.type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/40 bg-white/30 shadow-2xl backdrop-blur-xl transition-all duration-300 group-hover:scale-110 dark:border-white/30 dark:bg-black/40">
                  <Play className="ml-1 h-10 w-10 fill-none stroke-[2.5] text-white/90 dark:text-white/80" />
                </div>
              </div>
            )}
          </>
        ) : (
          content.type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/60 bg-white/50 shadow-2xl backdrop-blur-xl transition-all duration-300 group-hover:scale-110 dark:border-white/30 dark:bg-white/20">
                <Play className="ml-1 h-10 w-10 fill-none stroke-[2.5] text-gray-700 dark:text-white" />
              </div>
            </div>
          )
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="mb-1 text-lg font-semibold text-gray-900 transition-colors group-hover:text-brand dark:text-white">
          {content.title}
        </h3>
        <p className="mb-3 line-clamp-2 flex-1 text-sm text-gray-600 dark:text-gray-400">
          {content.description}
        </p>
        <div className="flex items-center justify-between">
          <span
            className={`rounded-full border-2 px-3 py-1 text-xs font-medium ${getCategoryColor(
              content.category
            )}`}
          >
            {content.category}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {content.duration}
          </span>
        </div>
      </div>
    </div>
  );
}

export function LearningCardSkeleton() {
  return (
    <div className="group flex h-full min-h-[360px] flex-col overflow-hidden rounded-2xl border border-transparent">
      <Skeleton className="relative aspect-video rounded-t-2xl mb-0" />
      <div className="flex flex-1 flex-col p-4">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-3 flex-1" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
}