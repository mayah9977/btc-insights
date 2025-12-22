import type { NotificationItem } from './notificationTypes';

export function calcNotificationStats(
  items: NotificationItem[]
) {
  const total = items.length;

  const byLevel = items.reduce(
    (acc, n) => {
      acc[n.level]++;
      return acc;
    },
    { INFO: 0, WARNING: 0, CRITICAL: 0 }
  );

  return {
    total,
    byLevel,
    criticalRate:
      total === 0 ? 0 : byLevel.CRITICAL / total,
  };
}
