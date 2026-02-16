/**
 * Related Lesson Card Component
 * Displays a related lesson with thumbnail, title, and metadata
 */

'use client';

import Link from 'next/link';
import { ClockIcon } from './ClockIcon';

interface RelatedLessonCardProps {
  id: string;
  title: string;
  duration: string;
  category: string;
  thumbnailUrl?: string;
  type?: 'video' | 'article' | 'guide';
}

export function RelatedLessonCard({
  id,
  title,
  duration,
  category,
  thumbnailUrl,
  type = 'video',
}: RelatedLessonCardProps) {
  // Generate proper URL based on content type
  const topicSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const categorySlug = category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const contentType = type || 'video';
  const href = `/learn/${categorySlug}/${topicSlug}/${contentType}/${id}`;

  return (
    <Link
      href={href}
      className="block rounded-xl bg-muted p-3 transition-colors hover:bg-accent"
    >
      <div className="flex items-start gap-3">
        {/* Thumbnail with fallback gradient */}
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-brand/20 to-brand/5">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title}
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <ClockIcon />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h5 className="mb-1 text-sm font-medium text-foreground line-clamp-2">
            {title}
          </h5>
          <div className="flex items-center gap-1.5 text-xs text-foreground/60">
            <ClockIcon />
            <span>{duration}</span>
            <span>|</span>
            <span>{category}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
