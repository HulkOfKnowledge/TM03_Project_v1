import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 * Used by shadcn/ui components
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency values
 */
export function formatCurrency(
  amount: number,
  currency: string = 'CAD'
): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format percentage values
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Calculate credit utilization percentage
 */
export function calculateUtilization(
  balance: number,
  limit: number
): number {
  if (limit === 0) return 0;
  return Math.min((balance / limit) * 100, 100);
}

/**
 * Mask credit card number (show only last 4 digits)
 */
export function maskCardNumber(lastFour: string): string {
  return `•••• ${lastFour}`;
}

/**
 * Get utilization status and color
 */
export function getUtilizationStatus(utilization: number): {
  status: 'excellent' | 'good' | 'fair' | 'poor';
  color: string;
} {
  if (utilization < 10) {
    return { status: 'excellent', color: 'text-green-600 dark:text-green-400' };
  } else if (utilization < 30) {
    return { status: 'good', color: 'text-blue-600 dark:text-blue-400' };
  } else if (utilization < 50) {
    return { status: 'fair', color: 'text-yellow-600 dark:text-yellow-400' };
  } else {
    return { status: 'poor', color: 'text-red-600 dark:text-red-400' };
  }
}

/**
 * Format date relative to now (e.g., "2 days ago")
 */
export function formatRelativeDate(date: string | Date): string {
  const now = new Date();
  const then = typeof date === 'string' ? new Date(date) : date;
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Sleep utility for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Get consistent gradient index for a card based on its unique identifier
 * This ensures the same card always has the same color across the app
 * 
 * @param cardId - Unique identifier for the card (id, lastFour, or any unique string)
 * @param totalGradients - Total number of available gradients (default: 11)
 * @returns A consistent index between 0 and totalGradients-1
 */
export function getCardGradientIndex(
  cardId: string | undefined,
  totalGradients: number = 11
): number {
  if (!cardId) return 0;

  // Simple hash function to convert string to number
  let hash = 0;
  for (let i = 0; i < cardId.length; i++) {
    const char = cardId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Ensure positive number and return index within range
  return Math.abs(hash) % totalGradients;
}
