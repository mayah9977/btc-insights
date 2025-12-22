import type { NotificationItem } from './notificationTypes';

const lastSent = new Map<string, number>();

export function canSendNotification(
  item: NotificationItem,
  cooldownMs = 10_000
) {
  const key = `${item.level}:${item.message}`;
  const now = Date.now();

  const prev = lastSent.get(key);
  if (prev && now - prev < cooldownMs) {
    return false;
  }

  lastSent.set(key, now);
  return true;
}
