import type { NotificationLevel } from '@/lib/notification/notificationTypes';

export function playNotificationFeedback(
  level: NotificationLevel,
  isVIP3: boolean
) {
  if (!isVIP3) return;

  if (level === 'CRITICAL') {
    navigator.vibrate?.([200, 100, 200]);
    new Audio('/sounds/extreme.mp3')
      .play()
      .catch(() => {});
  }

  if (level === 'WARNING') {
    navigator.vibrate?.(100);
  }
}
