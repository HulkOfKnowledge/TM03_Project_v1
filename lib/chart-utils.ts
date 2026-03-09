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

/** Last known utilization % for each day in `dates`. */
export function buildDailyUtilization(txns: Transaction[], creditLimit: number, dates: string[]): number[] {
  if (!creditLimit) return dates.map(() => 0);
  const sorted = [...txns].sort((a, b) => a.date.localeCompare(b.date));
  return dates.map(day => {
    const last = sorted.filter(t => t.date <= day).pop();
    if (!last || last.balance == null) return 0;
    return Math.min(Math.max((last.balance / creditLimit) * 100, 0), 100);
  });
}

/** Sum of purchases (positive amounts) for each day. */
export function buildDailySpending(txns: Transaction[], dates: string[]): number[] {
  const map = new Map<string, number>();
  txns.filter(t => t.amount > 0).forEach(t => map.set(t.date, (map.get(t.date) || 0) + t.amount));
  return dates.map(d => map.get(d) || 0);
}

/** Roll daily series into monthly buckets for long ranges. */
export function aggregateMonthly(
  dates: string[],
  values: number[],
  mode: 'last' | 'sum',
): { labels: string[]; data: number[] } {
  const buckets = new Map<string, number[]>();
  dates.forEach((d, i) => {
    const ym = d.slice(0, 7);
    if (!buckets.has(ym)) buckets.set(ym, []);
    buckets.get(ym)!.push(values[i]);
  });
  const labels: string[] = [];
  const data: number[] = [];
  for (const [ym, vals] of buckets) {
    labels.push(fmtMonthLabel(ym));
    data.push(mode === 'last' ? vals[vals.length - 1] : vals.reduce((a, b) => a + b, 0));
  }
  return { labels, data };
}
