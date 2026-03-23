export type NotificationTimeframe = 'daily' | 'weekly' | 'monthly';

export interface RewardNotification {
  id: string;
  transactionId: string;
  cardId: string;
  timeframe: NotificationTimeframe;
  createdAt: string;
  transactionDate: string;
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
  title: string;
  message: string;
  viewTransactionUrl: string;
}

export interface NotificationsSummary {
  unreadCount: number;
  daily: RewardNotification[];
  weekly: RewardNotification[];
  monthly: RewardNotification[];
}
