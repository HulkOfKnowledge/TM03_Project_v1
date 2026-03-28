import type { AppNotification, NotificationsSummary, NotificationTimeframe } from '@/types/notification.types';

export const NOTIFICATION_READ_STORAGE_KEY = 'creduman.readNotificationIds';
export const NOTIFICATION_READ_SYNC_EVENT = 'creduman:notification-read-sync';

export interface NotificationPillMeta {
  label: string;
  description: string;
}

export const notificationPillMeta: Record<NotificationTimeframe, NotificationPillMeta> = {
  daily: {
    label: 'Daily',
    description: 'Created in the last 24 hours.',
  },
  weekly: {
    label: 'Weekly',
    description: 'Created 2 to 7 days ago.',
  },
  monthly: {
    label: 'Monthly',
    description: 'Created 8 to 30 days ago.',
  },
};

export function flattenNotifications(summary: NotificationsSummary | null): AppNotification[] {
  if (!summary) return [];

  return [...summary.daily, ...summary.weekly, ...summary.monthly].sort(
    (a, b) => new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime(),
  );
}

export function formatNotificationTimestamp(dateLike: string | Date): string {
  const date = typeof dateLike === 'string' ? new Date(dateLike) : dateLike;
  if (Number.isNaN(date.getTime())) return 'Unknown date';

  const now = Date.now();
  const diffMs = Math.max(0, now - date.getTime());

  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (diffMs < minuteMs) {
    const seconds = Math.max(1, Math.floor(diffMs / 1000));
    return `${seconds} sec ago`;
  }

  if (diffMs < hourMs) {
    const minutes = Math.floor(diffMs / minuteMs);
    return `${minutes} min ago`;
  }

  if (diffMs < dayMs) {
    const hours = Math.floor(diffMs / hourMs);
    return `${hours} hr ago`;
  }

  if (diffMs < 4 * dayMs) {
    const days = Math.floor(diffMs / dayMs);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  }

  return new Intl.DateTimeFormat('en-CA', {
    month: 'short',
    day: 'numeric',
  })
    .format(date)
    .replace(',', '');
}

export function loadReadNotificationIds(): Set<string> {
  if (typeof window === 'undefined') return new Set<string>();

  try {
    const raw = window.localStorage.getItem(NOTIFICATION_READ_STORAGE_KEY);
    if (!raw) return new Set<string>();

    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) return new Set<string>();

    return new Set(parsed.filter((value) => typeof value === 'string'));
  } catch {
    return new Set<string>();
  }
}

export function persistReadNotificationIds(ids: Set<string>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(NOTIFICATION_READ_STORAGE_KEY, JSON.stringify(Array.from(ids)));
  window.dispatchEvent(new Event(NOTIFICATION_READ_SYNC_EVENT));
}

export function markNotificationAsRead(readIds: Set<string>, id: string): Set<string> {
  if (readIds.has(id)) return readIds;
  const next = new Set(readIds);
  next.add(id);
  return next;
}

export function subscribeToReadNotificationIds(onChange: (ids: Set<string>) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const syncFromStorage = (event: StorageEvent) => {
    if (event.key && event.key !== NOTIFICATION_READ_STORAGE_KEY) return;
    onChange(loadReadNotificationIds());
  };

  const syncFromCustomEvent = () => {
    onChange(loadReadNotificationIds());
  };

  window.addEventListener('storage', syncFromStorage);
  window.addEventListener(NOTIFICATION_READ_SYNC_EVENT, syncFromCustomEvent);

  return () => {
    window.removeEventListener('storage', syncFromStorage);
    window.removeEventListener(NOTIFICATION_READ_SYNC_EVENT, syncFromCustomEvent);
  };
}
