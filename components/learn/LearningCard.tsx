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
    const colors = ['bg-gray-200', 'bg-pink-100', 'bg-blue-100'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  return (
    <div className="group cursor-pointer" onClick={onClick}>
      <div
        className={`relative aspect-video rounded-2xl overflow-hidden mb-4 ${getThumbnailBg()}`}
      >
        {content.thumbnailUrl ? (
          <img
            src={content.thumbnailUrl}
            alt={content.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/80 dark:bg-white/90 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform">
              <Play className="h-8 w-8 text-gray-800 fill-gray-800 ml-1" />
            </div>
          </div>
        )}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-brand transition-colors">
        {content.title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        {content.description}
      </p>
      <div className="flex items-center justify-between">
        <span
          className={`px-3 py-1.5 text-xs font-medium rounded-full border-2 ${getCategoryColor(
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
