'use client';

import { useCallback, useEffect, useState } from 'react';

import {
  loadReadNotificationIds,
  markNotificationAsRead,
  persistReadNotificationIds,
  subscribeToReadNotificationIds,
} from '@/lib/notifications/ui';

export function useReadNotificationIds() {
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setReadNotificationIds(loadReadNotificationIds());
    return subscribeToReadNotificationIds(setReadNotificationIds);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setReadNotificationIds((current) => {
      const next = markNotificationAsRead(current, id);
      if (next !== current) {
        persistReadNotificationIds(next);
      }
      return next;
    });
  }, []);

  const markAllAsRead = useCallback((ids: string[]) => {
    setReadNotificationIds((current) => {
      if (ids.length === 0) return current;

      const next = new Set(current);
      ids.forEach((id) => next.add(id));

      if (next.size === current.size) {
        return current;
      }

      persistReadNotificationIds(next);
      return next;
    });
  }, []);

  return {
    readNotificationIds,
    markAsRead,
    markAllAsRead,
  };
}
