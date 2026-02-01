/**
 * Skeleton Loading Component
 * Reusable skeleton loader following DRY principles
 * Used for loading states across the application
 */

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'input' | 'button' | 'text';
}

export function Skeleton({ className, variant = 'default' }: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-muted rounded-lg';
  
  const variantClasses = {
    default: 'h-4 w-full',
    input: 'h-12 w-full',
    button: 'h-12 w-full',
    text: 'h-4 w-3/4',
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
    />
  );
}

interface FormSkeletonProps {
  className?: string;
}

export function FormSkeleton({ className }: FormSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Name Fields - Two columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" /> {/* Label */}
          <Skeleton variant="input" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" /> {/* Label */}
          <Skeleton variant="input" />
        </div>
      </div>

      {/* Mobile Number */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" /> {/* Label */}
        <Skeleton variant="input" />
      </div>

      {/* Email Address */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" /> {/* Label */}
        <Skeleton variant="input" />
      </div>

      {/* Password Button */}
      <Skeleton variant="button" className="h-12" />

      {/* Submit Button */}
      <Skeleton variant="button" className="h-12" />
    </div>
  );
}
