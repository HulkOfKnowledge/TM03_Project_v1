/**
 * Video Chapter Item Component
 * Displays a clickable video chapter with timestamp navigation
 */

'use client';

import { Play } from 'lucide-react';

interface VideoChapterItemProps {
  number: string;
  title: string;
  duration: string;
  timestamp: number;
  onSeek: (timestamp: number) => void;
}

export function VideoChapterItem({
  number,
  title,
  duration,
  timestamp,
  onSeek,
}: VideoChapterItemProps) {
  return (
    <button
      onClick={() => onSeek(timestamp)}
      className="flex w-full items-center justify-between rounded-lg border border-border p-3 text-left transition-colors hover:bg-accent"
    >
      <div className="flex items-center gap-3">
        <Play className="h-4 w-4 text-foreground/60" />
        <span className="text-sm font-medium text-foreground">
          {number}. {title}
        </span>
      </div>
      <span className="text-sm text-foreground/60">
        {duration}
      </span>
    </button>
  );
}
