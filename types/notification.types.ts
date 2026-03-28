export type NotificationTimeframe = 'daily' | 'weekly' | 'monthly';
export type NotificationKind = 'reward_optimization' | 'system' | 'profile' | 'activity';

export interface BaseNotification {
  id: string;
  kind: NotificationKind;
  timeframe: NotificationTimeframe;
  createdAt: string;
  eventDate: string;
  title: string;
  message: string;
  actionUrl?: string | null;
  metadata?: Record<string, unknown>;
}

export interface RewardNotification extends BaseNotification {
  kind: 'reward_optimization';
  transactionId: string;
  cardId: string;
  merchant: string;
  category: string;
  amount: number;
  baselineCardId: string;
  baselineCardLabel: string;
  recommendedCardId: string;
  recommendedCardLabel: string;
  baselineRate: number;
  recommendedRate: number;
  incrementalReward: number;
  viewTransactionUrl: string;
}

export interface SystemNotification extends BaseNotification {
  kind: 'system';
  severity?: 'info' | 'warning' | 'critical';
}

export interface ProfileNotification extends BaseNotification {
  kind: 'profile';
  profileSection?: string;
}

export interface ActivityNotification extends BaseNotification {
  kind: 'activity';
  actorLabel?: string;
}

export type AppNotification =
  | RewardNotification
  | SystemNotification
  | ProfileNotification
  | ActivityNotification;

export interface NotificationsSummary {
  unreadCount: number;
  daily: AppNotification[];
  weekly: AppNotification[];
  monthly: AppNotification[];
  byKind: Record<NotificationKind, number>;
}
