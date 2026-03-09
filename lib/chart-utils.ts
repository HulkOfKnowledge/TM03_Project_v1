/**
 * Chart utility functions
 * Pure helpers shared across credit analysis chart components
 */

import type { Transaction } from '@/types/card.types';

export function getDatesInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start + 'T12:00:00');
  const last = new Date(end + 'T12:00:00');
  while (cur <= last) {
    dates.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

export function fmtDayLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function fmtMonthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

/** Last known utilization % for each day in `dates`. Returns null for dates after `today` when provided. */
export function buildDailyUtilization(txns: Transaction[], creditLimit: number, dates: string[], today?: string): (number | null)[] {
  if (!creditLimit) return dates.map(() => 0);
  const sorted = [...txns].sort((a, b) => a.date.localeCompare(b.date));
  return dates.map(day => {
    if (today && day > today) return null;
    const last = sorted.filter(t => t.date <= day).pop();
    if (!last || last.balance == null) return 0;
    return Math.min(Math.max((last.balance / creditLimit) * 100, 0), 100);
  });
}

/** Sum of purchases (positive amounts) for each day. Returns null for dates after `today` when provided. */
export function buildDailySpending(txns: Transaction[], dates: string[], today?: string): (number | null)[] {
  const map = new Map<string, number>();
  txns.filter(t => t.amount > 0).forEach(t => map.set(t.date, (map.get(t.date) || 0) + t.amount));
  return dates.map(d => {
    if (today && d > today) return null;
    return map.get(d) || 0;
  });
}

/** Roll daily series into monthly buckets for long ranges. */
export function aggregateMonthly(
  dates: string[],
  values: (number | null)[],
  mode: 'last' | 'sum',
): { labels: string[]; data: (number | null)[] } {
  const buckets = new Map<string, (number | null)[]>();
  dates.forEach((d, i) => {
    const ym = d.slice(0, 7);
    if (!buckets.has(ym)) buckets.set(ym, []);
    buckets.get(ym)!.push(values[i]);
  });
  const labels: string[] = [];
  const data: (number | null)[] = [];
  for (const [ym, vals] of buckets) {
    labels.push(fmtMonthLabel(ym));
    if (mode === 'last') {
      // Use last non-null value; if all are null the month has no data
      const lastNonNull = [...vals].reverse().find(v => v !== null);
      data.push(lastNonNull !== undefined ? lastNonNull : null);
    } else {
      const hasData = vals.some(v => v !== null);
      data.push(hasData ? vals.reduce((a: number, b) => a + (b ?? 0), 0) : null);
    }
  }
  return { labels, data };
}
