export const zoneOrder: Record<string, number> = {
  Safe: 1,
  Caution: 2,
  Danger: 3,
};

export function formatCurrency(amount: number) {
  const absAmount = Math.abs(amount);
  return `$${absAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(dateString: string) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getZoneColor(zone: string | undefined) {
  if (!zone) return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';

  switch (zone) {
    case 'Safe':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'Caution':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'Danger':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
}

export function getTransactionType(amount: number) {
  return amount < 0 ? 'Payment' : 'Purchase';
}

export function getTransactionTypeColor(amount: number) {
  return amount < 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
}
