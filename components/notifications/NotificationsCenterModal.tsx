'use client';

import { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCheck, Search, X } from 'lucide-react';

import { NotificationDetailsContent } from '@/components/notifications/NotificationDetailsContent';
import { NotificationDropdownSkeleton } from '@/components/notifications/NotificationSkeletons';
import { Modal } from '@/components/ui/Modal';
import { PaginationControls } from '@/components/ui/PaginationControls';
import { formatNotificationTimestamp } from '@/lib/notifications/ui';
import { cn, formatCurrency } from '@/lib/utils';
import type { AppNotification } from '@/types/notification.types';

type NotificationViewFilter = 'all' | 'unread' | 'today' | 'last7days' | 'monthly';
type NotificationTypeFilter = 'all' | 'warnings' | 'missedRewards' | 'newCards';
const PAGE_SIZE = 8;

const VIEW_FILTER_ITEMS: Array<{ key: NotificationViewFilter; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'today', label: 'Today' },
  { key: 'last7days', label: 'Last 7 days' },
  { key: 'monthly', label: 'Monthly' },
];

const TYPE_FILTER_ITEMS: Array<{ key: NotificationTypeFilter; label: string }> = [
  { key: 'all', label: 'All types' },
  { key: 'warnings', label: 'Warnings' },
  { key: 'missedRewards', label: 'Missed rewards' },
  { key: 'newCards', label: 'New cards' },
];

interface NotificationsCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  notificationsLoading: boolean;
  readNotificationIds: Set<string>;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: (ids: string[]) => void;
  initialNotification: AppNotification | null;
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
  const [viewFilter, setViewFilter] = useState<NotificationViewFilter>('all');
  const [typeFilter, setTypeFilter] = useState<NotificationTypeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotification, setSelectedNotification] = useState<AppNotification | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const isCardDangerNotification = (item: AppNotification) =>
    item.kind === 'system' && item.metadata?.source === 'card-utilization';

  const isWarningNotification = (item: AppNotification) =>
    item.kind === 'system' && (item.severity === 'warning' || item.severity === 'critical' || isCardDangerNotification(item));

  const isMissedRewardNotification = (item: AppNotification) =>
    item.kind === 'reward_optimization' && (item.optimizationType ?? 'owned_card_switch') === 'owned_card_switch';

  const isNewCardNotification = (item: AppNotification) =>
    item.kind === 'reward_optimization' && item.optimizationType === 'new_card_opportunity';

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
  }, [viewFilter, typeFilter, searchQuery]);

  const notificationsMatchingViewAndSearch = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const matchesViewFilter = (item: AppNotification) => {
      const itemDate = new Date(item.eventDate);

      if (viewFilter === 'unread') {
        return !readNotificationIds.has(item.id);
      }

      if (viewFilter === 'today') {
        return itemDate >= startOfToday;
      }

      if (viewFilter === 'last7days') {
        return itemDate >= sevenDaysAgo;
      }

      if (viewFilter === 'monthly') {
        return itemDate.getFullYear() === now.getFullYear() && itemDate.getMonth() === now.getMonth();
      }

      return true;
    };

    const normalizedQuery = searchQuery.trim().toLowerCase();
    const matchesSearchQuery = (item: AppNotification) => {
      if (!normalizedQuery) return true;

      const haystack = [
        item.title,
        item.message,
        item.kind,
        item.kind === 'reward_optimization' ? item.merchant : '',
        item.kind === 'reward_optimization' ? item.category : '',
        item.kind === 'reward_optimization' ? item.recommendedCardLabel : '',
        item.kind === 'reward_optimization' ? item.baselineCardLabel : '',
        item.kind === 'reward_optimization' ? item.optimizationType || '' : '',
        item.kind === 'reward_optimization' ? item.suggestedOfferIssuer || '' : '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    };

    return notifications.filter((item) => matchesViewFilter(item) && matchesSearchQuery(item));
  }, [notifications, readNotificationIds, searchQuery, viewFilter]);

  const filteredNotifications = useMemo(() => {
    const matchesTypeFilter = (item: AppNotification) => {
      if (typeFilter === 'warnings') {
        return isWarningNotification(item);
      }

      if (typeFilter === 'missedRewards') {
        return isMissedRewardNotification(item);
      }

      if (typeFilter === 'newCards') {
        return isNewCardNotification(item);
      }

      return true;
    };

    return notificationsMatchingViewAndSearch.filter(matchesTypeFilter);
  }, [notificationsMatchingViewAndSearch, typeFilter]);

  const typeFilterCounts = useMemo(() => ({
    all: notificationsMatchingViewAndSearch.length,
    warnings: notificationsMatchingViewAndSearch.filter(isWarningNotification).length,
    missedRewards: notificationsMatchingViewAndSearch.filter(isMissedRewardNotification).length,
    newCards: notificationsMatchingViewAndSearch.filter(isNewCardNotification).length,
  }), [notificationsMatchingViewAndSearch]);

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

  const openDetails = (item: AppNotification) => {
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
      <div className="relative flex h-[min(90vh,46rem)] w-full flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-[0_14px_48px_rgba(0,0,0,0.22)]">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-3 top-3 z-30 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:right-4 sm:top-4"
          aria-label="Close notifications modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="border-b border-border/80 bg-muted/20 px-3 py-3 sm:px-5 sm:py-4">
          <div className="pr-10 sm:pr-12">
            <h2 className="text-lg font-semibold text-foreground sm:text-2xl">Notifications</h2>
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

            <div className="-mx-0.5 flex items-center gap-1.5 overflow-x-auto px-0.5 pb-3 pt-1 sm:mx-0 sm:px-0 sm:pb-0">
              <label className="flex shrink-0 items-center">
                <select
                  value={viewFilter}
                  onChange={(event) => setViewFilter(event.target.value as NotificationViewFilter)}
                  className="h-10 rounded-lg border border-border bg-background px-2 text-sm text-foreground outline-none transition-colors focus:border-brand"
                  aria-label="Filter notifications by timeframe"
                >
                  {VIEW_FILTER_ITEMS.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex items-center gap-1.5">
                {TYPE_FILTER_ITEMS.map((filter) => {
                  const isActive = typeFilter === filter.key;
                  const count =
                    filter.key === 'warnings'
                      ? typeFilterCounts.warnings
                      : filter.key === 'missedRewards'
                        ? typeFilterCounts.missedRewards
                        : filter.key === 'newCards'
                          ? typeFilterCounts.newCards
                          : typeFilterCounts.all;

                  return (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => setTypeFilter(filter.key)}
                      className={cn(
                        'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm',
                        isActive
                          ? 'bg-brand text-white'
                          : 'bg-background text-muted-foreground hover:text-foreground ring-1 ring-border',
                      )}
                    >
                      {filter.label}
                      <span className={cn('ml-1.5 text-[11px]', isActive ? 'text-white/90' : 'text-muted-foreground')}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => onMarkAllAsRead(notifications.map((item) => item.id))}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Mark all as read"
                title="Mark all as read"
              >
                <CheckCheck className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="relative flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 overflow-y-auto overscroll-contain [scrollbar-width:thin] [scrollbar-color:#e5e7eb_transparent] dark:[scrollbar-color:#374151_transparent] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb:hover]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 dark:[&::-webkit-scrollbar-thumb:hover]:bg-gray-600">
              {notificationsLoading ? (
                <NotificationDropdownSkeleton rows={8} />
              ) : filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground sm:p-12">
                  <Bell className="mx-auto mb-2 h-12 w-12 opacity-50 sm:h-16 sm:w-16" />
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
                                    {formatNotificationTimestamp(item.eventDate)}
                              </p>
                            </div>

                            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground sm:text-sm">{item.message}</p>

                            {item.kind === 'reward_optimization' && (
                              <p className="mt-1.5 text-xs font-medium text-brand sm:text-sm">
                                +{formatCurrency(item.incrementalReward)}
                                {item.optimizationType === 'new_card_opportunity' ? '/mo' : ''}
                              </p>
                            )}
                            {isCardDangerNotification(item) && (
                              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 sm:text-sm">
                                Above 30% utilization threshold
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-start gap-3">
                            <span className="mt-1 h-2.5 w-2.5 rounded-full bg-brand" aria-hidden="true" />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <p className="line-clamp-1 text-sm font-semibold text-foreground sm:text-[15px]">{item.title}</p>
                                <p className="shrink-0 text-[11px] text-muted-foreground sm:text-xs">
                                  {formatNotificationTimestamp(item.eventDate)}
                                </p>
                              </div>

                              <p className="mt-1 line-clamp-1 text-xs text-muted-foreground sm:text-sm">{item.message}</p>

                              {item.kind === 'reward_optimization' && (
                                <p className="mt-1.5 text-xs font-medium text-brand sm:text-sm">
                                  +{formatCurrency(item.incrementalReward)}
                                  {item.optimizationType === 'new_card_opportunity' ? '/mo' : ''}
                                </p>
                              )}
                              {isCardDangerNotification(item) && (
                                <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 sm:text-sm">
                                  Above 30% utilization threshold
                                </p>
                              )}
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
              className="px-3 sm:px-4"
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
            'absolute inset-y-0 right-0 z-30 w-full bg-background shadow-2xl transition-transform duration-300 ease-out sm:w-[75%]',
            selectedNotification ? 'translate-x-0' : 'translate-x-full',
          )}
          aria-hidden={!selectedNotification}
        >
          {selectedNotification && (
            <div className="relative flex h-full flex-col">
              <button
                type="button"
                onClick={closeDetails}
                className="absolute right-3 top-3 z-40 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground sm:right-4 sm:top-4"
                aria-label="Close notification details"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="px-3 py-3 pr-10 sm:px-5 sm:py-4 sm:pr-12">
                <p className="line-clamp-2 text-sm font-semibold text-foreground sm:text-base">
                  {selectedNotification.title}
                </p>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
                  {formatNotificationTimestamp(selectedNotification.eventDate)}
                </p>
              </div>

              <div className="flex-1 min-h-0 overflow-hidden px-3 pb-4 sm:px-5 sm:pb-5">
                <NotificationDetailsContent notification={selectedNotification} isActive={!!selectedNotification && isOpen} />
              </div>
            </div>
          )}
        </aside>
      </div>
    </Modal>
  );
}
