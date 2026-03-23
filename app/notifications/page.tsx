'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck } from 'lucide-react';

import { Navigation } from '@/components/dashboard/Navigation';
import { Footer } from '@/components/landing/Footer';
import { NotificationDetailModal } from '@/components/notifications/NotificationDetailModal';
import { NotificationsPageSkeleton } from '@/components/notifications/NotificationSkeletons';
import { PaginationControls } from '@/components/ui/PaginationControls';
import {
  flattenNotifications,
  formatNotificationTimestamp,
  loadReadNotificationIds,
  markNotificationAsRead,
  persistReadNotificationIds,
} from '@/lib/notifications/ui';
import { cn, formatCurrency } from '@/lib/utils';
import type { NotificationsSummary, NotificationTimeframe, RewardNotification } from '@/types/notification.types';

type NotificationFilter = 'all' | 'unread' | NotificationTimeframe;

const SELECT_CLASS =
  'w-[88px] rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:w-auto sm:px-3 sm:py-2 sm:text-sm dark:border-gray-800 dark:bg-gray-950 dark:text-white';

function NotificationRow({
  item,
  isRead,
  onOpen,
}: {
  item: RewardNotification;
  isRead: boolean;
  onOpen: (item: RewardNotification) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className={cn(
        'w-full rounded-lg p-2 text-left transition-colors',
        isRead
          ? 'bg-white dark:bg-black'
          : 'bg-gray-50 dark:bg-gray-900/80',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {!isRead && <span className="inline-flex h-2 w-2 rounded-full bg-brand" aria-hidden="true" />}
            <h3 className="line-clamp-1 text-sm font-medium text-foreground md:text-base">{item.title}</h3>
          </div>
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
            {item.merchant} - {formatCurrency(item.amount)} - Potential {formatCurrency(item.incrementalReward)}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xs font-medium text-muted-foreground">{formatNotificationTimestamp(item.transactionDate)}</p>
          <p className="mt-1 text-xs font-medium text-brand">{isRead ? 'Read' : 'Unread'}</p>
        </div>
      </div>
    </button>
  );
}

export default function NotificationsPage() {
  const pageSize = 10;
  const [data, setData] = useState<NotificationsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<NotificationFilter>('all');
  const [selectedNotification, setSelectedNotification] = useState<RewardNotification | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setReadNotificationIds(loadReadNotificationIds());
  }, []);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/notifications', {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload.error?.message || 'Failed to load notifications');
        }

        const payload = await response.json();
        setData(payload.data as NotificationsSummary);
      } catch (err) {
        console.error(err);
        setError('Could not load notifications. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadNotifications();
  }, []);

  const allNotifications = useMemo(() => flattenNotifications(data), [data]);

  const counts = useMemo(() => {
    const unread = allNotifications.filter((item) => !readNotificationIds.has(item.id)).length;

    return {
      all: allNotifications.length,
      unread,
      daily: data?.daily.length || 0,
      weekly: data?.weekly.length || 0,
      monthly: data?.monthly.length || 0,
    };
  }, [allNotifications, data, readNotificationIds]);

  const filteredNotifications = useMemo(() => {
    if (activeTab === 'all') return allNotifications;
    if (activeTab === 'unread') return allNotifications.filter((item) => !readNotificationIds.has(item.id));
    return allNotifications.filter((item) => item.timeframe === activeTab);
  }, [activeTab, allNotifications, readNotificationIds]);

  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredNotifications.slice(start, start + pageSize);
  }, [currentPage, filteredNotifications]);

  const openDetails = (item: RewardNotification) => {
    const nextReadIds = markNotificationAsRead(readNotificationIds, item.id);
    setReadNotificationIds(nextReadIds);
    persistReadNotificationIds(nextReadIds);
    setSelectedNotification(item);
    setDetailModalOpen(true);
  };

  const markAllAsRead = () => {
    const nextReadIds = new Set(readNotificationIds);
    allNotifications.forEach((item) => nextReadIds.add(item.id));
    setReadNotificationIds(nextReadIds);
    persistReadNotificationIds(nextReadIds);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <Navigation />

      <main className="pb-16 pt-28 lg:pt-40">
        <div className="container mx-auto px-4 md:px-6">
          <div className="mb-4 grid grid-cols-[1fr_auto] items-center gap-2">
            <h1 className="text-2xl font-bold text-brand sm:text-3xl md:text-4xl">Notifications</h1>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as NotificationFilter)}
                className={SELECT_CLASS}
              >
                <option value="all">All</option>
                <option value="unread">Unread ({counts.unread})</option>
                <option value="daily">Daily ({counts.daily})</option>
                <option value="weekly">Weekly ({counts.weekly})</option>
                <option value="monthly">Monthly ({counts.monthly})</option>
              </select>

              {counts.unread > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="inline-flex items-center gap-1 rounded-lg bg-accent px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent/80 sm:px-3 sm:py-2 sm:text-sm"
                >
                  <CheckCheck className="h-4 w-4" />
                  <span>Mark read</span>
                </button>
              )}
            </div>
          </div>

          <div className="mb-6 border-t border-gray-200 dark:border-white/10 pt-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">Tap a notification to open full details.</p>
          </div>

          {isLoading ? (
            <NotificationsPageSkeleton rows={pageSize} />
          ) : error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-6 text-sm text-destructive">{error}</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="rounded-xl bg-white p-10 text-center dark:bg-black">
              <Bell className="mx-auto h-10 w-10 text-muted-foreground" />
              <p className="mt-3 font-medium text-foreground">No notifications in this view</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try another filter or come back after more card activity.
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl bg-white dark:bg-black">
              <div className="space-y-2">
                {paginatedNotifications.map((item) => (
                  <NotificationRow
                    key={item.id}
                    item={item}
                    isRead={readNotificationIds.has(item.id)}
                    onOpen={openDetails}
                  />
                ))}
              </div>

              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                totalItems={filteredNotifications.length}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </main>

      <NotificationDetailModal
        isOpen={detailModalOpen}
        notification={selectedNotification}
        onClose={() => setDetailModalOpen(false)}
      />

      <Footer />
    </div>
  );
}
