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
    <div className="group cursor-pointer bg-background border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden hover:border-gray-300 dark:hover:border-gray-700 transition-colors" onClick={onClick}>
      <div
        className={`relative aspect-video ${getThumbnailBg()}`}
      >
        {content.thumbnailUrl ? (
          <>
            <img
              src={content.thumbnailUrl}
              alt={content.title}
              className="w-full h-full object-cover"
            />
            {/* Play button overlay for videos only */}
            {content.type === 'video' && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-white/30 dark:bg-black/40 backdrop-blur-xl border border-white/40 dark:border-white/30 flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-2xl">
                  <Play className="h-10 w-10 text-white/90 dark:text-white/80 fill-none stroke-[2.5] ml-1" />
                </div>
              </div>
            )}
          </>
        ) : (
          content.type === 'video' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-white/50 dark:bg-white/20 backdrop-blur-xl border border-white/60 dark:border-white/30 flex items-center justify-center group-hover:scale-110 transition-all duration-300 shadow-2xl">
                <Play className="h-10 w-10 text-gray-700 dark:text-white fill-none stroke-[2.5] ml-1" />
              </div>
            </div>
          )
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-brand transition-colors">
          {content.title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {content.description}
        </p>
        <div className="flex items-center justify-between mb-1">
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full border-2 ${getCategoryColor(
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
    <div className="group">
      <Skeleton className="relative aspect-video rounded-2xl mb-4" />
      <Skeleton className="h-5 w-3/4 mb-2" />
      <Skeleton className="h-4 w-full mb-2" />
      <Skeleton className="h-4 w-2/3 mb-4" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  );
}