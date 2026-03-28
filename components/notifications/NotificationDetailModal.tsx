'use client';

import { Modal } from '@/components/ui/Modal';
import { NotificationDetailsContent } from '@/components/notifications/NotificationDetailsContent';
import type { AppNotification } from '@/types/notification.types';

interface NotificationDetailModalProps {
  isOpen: boolean;
  notification: AppNotification | null;
  onClose: () => void;
}

export function NotificationDetailModal({ isOpen, notification, onClose }: NotificationDetailModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      showCloseButton
      size="lg"
      title={notification?.title || 'Notification details'}
      description={undefined}
    >
      {!notification ? null : <NotificationDetailsContent notification={notification} isActive={isOpen} />}
    </Modal>
  );
}
