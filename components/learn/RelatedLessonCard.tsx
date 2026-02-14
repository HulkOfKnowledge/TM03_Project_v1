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
}

export function RelatedLessonCard({
  id,
  title,
  duration,
  category,
  thumbnailUrl,
}: RelatedLessonCardProps) {
  return (
    <Link
      href={`/learn/lesson/${id}`}
      className="block rounded-xl bg-muted p-3 transition-colors hover:bg-accent"
    >
      <div className="flex items-start gap-3">
        <div className="h-16 w-16 shrink-0 rounded-lg bg-gray-200" />
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
