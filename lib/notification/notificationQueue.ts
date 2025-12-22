import type { NotificationItem } from '@/lib/notification/notificationTypes';

const queue: NotificationItem[] = [];

export function pushNotification(item: NotificationItem) {
  queue.push(item);
}

export function pullNotifications(limit = 10) {
  return queue
    .sort((a, b) => {
      const weight = (l: string) =>
        l === 'CRITICAL' ? 3 : l === 'WARNING' ? 2 : 1;
      return weight(b.level) - weight(a.level);
    })
    .splice(0, limit);
}
