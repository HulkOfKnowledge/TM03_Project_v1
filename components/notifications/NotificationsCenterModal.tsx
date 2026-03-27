'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, Search, X } from 'lucide-react';

import { NotificationDetailsContent } from '@/components/notifications/NotificationDetailsContent';
import { NotificationDropdownSkeleton } from '@/components/notifications/NotificationSkeletons';
import { Modal } from '@/components/ui/Modal';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { formatNotificationTimestamp } from '@/lib/notifications/ui';
import { cn, formatCurrency } from '@/lib/utils';
import type { RewardNotification } from '@/types/notification.types';

type NotificationFilter = 'all' | 'unread' | 'today' | 'last7days' | 'thisMonth';
const PAGE_SIZE = 8;

const FILTER_ITEMS: Array<{ key: NotificationFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'today', label: 'Today' },
  { key: 'last7days', label: 'Last 7 days' },
  { key: 'thisMonth', label: 'This month' },
];

interface NotificationsCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: RewardNotification[];
  notificationsLoading: boolean;
  readNotificationIds: Set<string>;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: (ids: string[]) => void;
  initialNotification: RewardNotification | null;
}

export function NotificationsCenterModal({
  isOpen,
  onClose,
  notifications,
  notificationsLoading,
  readNotificationIds,
  onMarkAsRead,
  onMarkAllAsRead,
  initialNotification,
}: NotificationsCenterModalProps) {
  const [activeTab, setActiveTab] = useState<NotificationFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotification, setSelectedNotification] = useState<RewardNotification | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!isOpen) {
      setSelectedNotification(null);
      setCurrentPage(1);
      return;
    }

    if (initialNotification) {
      onMarkAsRead(initialNotification.id);
      setSelectedNotification(initialNotification);
    }
  }, [initialNotification, isOpen, onMarkAsRead]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchQuery]);

  const unreadCount = useMemo(
    () => notifications.filter((item) => !readNotificationIds.has(item.id)).length,
    [notifications, readNotificationIds],
  );

  const filteredNotifications = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let next = notifications;

    if (activeTab === 'unread') {
      next = next.filter((item) => !readNotificationIds.has(item.id));
    }

    if (activeTab === 'today') {
      next = next.filter((item) => new Date(item.transactionDate) >= startOfToday);
    }

    if (activeTab === 'last7days') {
      next = next.filter((item) => new Date(item.transactionDate) >= sevenDaysAgo);
    }

    if (activeTab === 'thisMonth') {
      next = next.filter((item) => {
        const itemDate = new Date(item.transactionDate);
        return itemDate.getFullYear() === now.getFullYear() && itemDate.getMonth() === now.getMonth();
      });
    }

    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (!normalizedQuery) return next;

    return next.filter((item) => {
      const haystack = [
        item.title,
        item.message,
        item.merchant,
        item.category,
        item.recommendedCardLabel,
        item.baselineCardLabel,
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [activeTab, notifications, readNotificationIds, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredNotifications.slice(start, start + PAGE_SIZE);
  }, [currentPage, filteredNotifications]);

  const openDetails = (item: RewardNotification) => {
    onMarkAsRead(item.id);
    setSelectedNotification(item);
  };

  const closeDetails = () => {
    setSelectedNotification(null);
  };

  const handleClose = () => {
    closeDetails();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      showCloseButton={false}
      size="2xl"
      withContentWrapper={false}
    >
      <div className="relative overflow-hidden rounded-2xl border border-border bg-background shadow-[0_14px_48px_rgba(0,0,0,0.22)]">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 z-30 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label="Close notifications modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="border-b border-border/80 bg-muted/20 px-4 py-4 sm:px-5">
          <div className="pr-12">
            <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Notifications</h2>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">Stay on top of your credit reward opportunities.</p>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search notifications"
                className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-brand"
                aria-label="Search notifications"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {FILTER_ITEMS.map((filter) => {
                  const isActive = activeTab === filter.key;
                  return (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => setActiveTab(filter.key)}
                      className={cn(
                        'rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm',
                        isActive
                          ? 'bg-brand text-white'
                          : 'bg-background text-muted-foreground hover:text-foreground ring-1 ring-border',
                      )}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => onMarkAllAsRead(notifications.map((item) => item.id))}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-medium text-foreground transition-colors hover:bg-accent sm:text-sm"
                >
                  <CheckCheck className="h-4 w-4" />
                  Mark all as read
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="relative min-h-[460px]">
          <div className="flex max-h-[min(68vh,40rem)] flex-col">
            <div className="overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:#e5e7eb_transparent] dark:[scrollbar-color:#374151_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb:hover]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 dark:[&::-webkit-scrollbar-thumb:hover]:bg-gray-600">
              {notificationsLoading ? (
                <NotificationDropdownSkeleton rows={8} />
              ) : filteredNotifications.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground">
                  <Bell className="mx-auto mb-2 h-20 w-20 opacity-50" />
                  <p className="text-sm font-medium text-foreground">No notifications in this view</p>
                  <p className="mt-1 text-xs">Try another filter or check back later.</p>
                </div>
              ) : (
                <div className="divide-y divide-border/70">
                  {paginatedNotifications.map((item) => {
                    const isRead = readNotificationIds.has(item.id);

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => openDetails(item)}
                        className={cn(
                          'w-full bg-background px-4 py-3 text-left transition-colors hover:bg-muted/35 sm:px-5',
                          !isRead && 'bg-brand/5 dark:bg-brand/10',
                        )}
                      >
                        {isRead ? (
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <p className="line-clamp-1 text-sm text-foreground/85 sm:text-[15px]">{item.title}</p>
                              <p className="shrink-0 text-[11px] text-muted-foreground sm:text-xs">
                                {formatNotificationTimestamp(item.transactionDate)}
                              </p>
                            </div>

                            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground sm:text-sm">{item.message}</p>

                            <p className="mt-1.5 text-xs font-medium text-brand sm:text-sm">+{formatCurrency(item.incrementalReward)}</p>
                          </div>
                        ) : (
                          <div className="flex items-start gap-3">
                            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand" aria-hidden="true" />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <p className="line-clamp-1 text-sm font-semibold text-foreground sm:text-[15px]">{item.title}</p>
                                <p className="shrink-0 text-[11px] text-muted-foreground sm:text-xs">
                                  {formatNotificationTimestamp(item.transactionDate)}
                                </p>
                              </div>

                              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground sm:text-sm">{item.message}</p>

                              <p className="mt-1.5 text-xs font-medium text-brand sm:text-sm">+{formatCurrency(item.incrementalReward)}</p>
                            </div>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={PAGE_SIZE}
              totalItems={filteredNotifications.length}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>

        <div
          className={cn(
            'absolute inset-0 z-20 bg-black/65 transition-opacity duration-250',
            selectedNotification ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
          onClick={closeDetails}
          aria-hidden={!selectedNotification}
        />

        <aside
          className={cn(
            'absolute inset-y-0 right-0 z-30 w-[75%] bg-background shadow-2xl transition-transform duration-300 ease-out',
            selectedNotification ? 'translate-x-0' : 'translate-x-full',
          )}
          aria-hidden={!selectedNotification}
        >
          {selectedNotification && (
            <div className="relative flex h-full flex-col">
              <button
                type="button"
                onClick={closeDetails}
                className="absolute right-4 top-4 z-40 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Close notification details"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="px-5 py-4 pr-12">
                <p className="line-clamp-2 text-sm font-semibold text-foreground sm:text-base">
                  {selectedNotification.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  {formatNotificationTimestamp(selectedNotification.transactionDate)}
                </p>
              </div>

              <div className="flex-1 px-5 pb-5">
                <NotificationDetailsContent notification={selectedNotification} isActive={!!selectedNotification && isOpen} />
              </div>
            </div>
          )}
        </aside>
      </div>
    </Modal>
  );
}