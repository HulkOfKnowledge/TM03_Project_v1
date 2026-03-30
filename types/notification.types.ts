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
  optimizationType?: 'owned_card_switch' | 'new_card_opportunity';
  transactionId: string;
  cardId: string;
  merchant: string;
  category: string;
  amount: number;
  baselineCardId: string;
  baselineCardLabel: string;
  recommendedCardId: string;
  recommendedOfferId?: string;
  recommendedCardLabel: string;
  baselineRate: number;
  recommendedRate: number;
  incrementalReward: number;
  viewTransactionUrl: string;
  estimatedMonthlyIncrementalReward?: number;
  estimatedAnnualIncrementalReward?: number;
  spendSharePercentage?: number;
  estimatedMonthlySpend?: number;
  suggestedOfferIssuer?: string | null;
  annualFee?: number | null;
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
  notifications: AppNotification[];
  byKind: Record<NotificationKind, number>;
}
