import type { NotificationItem } from './notificationTypes';

const history: NotificationItem[] = [];

export function recordNotification(item: NotificationItem) {
  history.unshift(item);
  if (history.length > 200) history.pop();
}

export function getNotificationHistory() {
  return [...history];
}

export function getNotificationStats() {
  return history.reduce(
    (acc, n) => {
      acc.total++;
      acc[n.level]++;
      return acc;
    },
    { total: 0, INFO: 0, WARNING: 0, CRITICAL: 0 }
  );
}
