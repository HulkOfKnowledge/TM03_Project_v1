/**
 * Info List Item Component
 * Reusable component for checklist/info items in lesson previews
 * Used in both VideoLayout and QuizContent for consistency
 */

'use client';

import { Check } from 'lucide-react';
import { ReactNode } from 'react';

interface InfoListItemProps {
  text: string;
  icon?: ReactNode;
  variant?: 'check' | 'custom';
}

export function InfoListItem({ 
  text, 
  icon,
  variant = 'check' 
}: InfoListItemProps) {
  // Default check icon
  const defaultIcon = (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
      <svg 
        className="h-4 w-4 text-foreground/60" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth={2}
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          d="M5 13l4 4L19 7" 
        />
      </svg>
    </div>
  );

  // Check with brand background
  const brandCheckIcon = (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand">
      <Check className="h-4 w-4 text-background" />
    </div>
  );

  const displayIcon = icon || (variant === 'check' ? brandCheckIcon : defaultIcon);

  return (
    <div className="flex items-start gap-3 rounded-lg p-3 md:gap-4 md:p-0">
      {displayIcon}
      <p className="flex-1 text-sm leading-relaxed text-foreground/70 md:text-base">
        {text}
      </p>
    </div>
  );
}
