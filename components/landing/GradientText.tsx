/**
 * Gradient Text Component
 * Reusable gradient text with brand colors
 */

import { cn } from '@/lib/utils';

interface GradientTextProps {
  children: React.ReactNode;
  className?: string;
}

export function GradientText({ children, className }: GradientTextProps) {
  return (
    <span
      className={cn(
        'bg-gradient-to-r from-brand-500 to-brand-700 bg-clip-text text-transparent',
        className
      )}
    >
      {children}
    </span>
  );
}
