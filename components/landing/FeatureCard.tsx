/**
 * Feature Card Component
 * Reusable card for displaying features
 */

import { cn } from '@/lib/utils';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

export function FeatureCard({
  icon,
  title,
  description,
  className,
}: FeatureCardProps) {
  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-lg border bg-card p-6 hover:shadow-lg transition-all duration-300',
        className
      )}
    >
      <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-brand/10 text-brand">
        {icon}
      </div>
      <h3 className="mb-2 text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
      <div className="absolute bottom-0 left-0 h-1 w-0 bg-brand transition-all duration-300 group-hover:w-full" />
    </div>
  );
}
