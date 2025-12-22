'use client';

import { pullNotifications } from '@/lib/notification/notificationQueue';
import { calcNotificationStats } from '@/lib/notification/notificationStats';

export function NotificationStats() {
  const items = pullNotifications(100);
  const stats = calcNotificationStats(items);

  return (
    <div style={{ fontSize: 13 }}>
      <div>총 알림: {stats.total}</div>
      <div>INFO: {stats.byLevel.INFO}</div>
      <div>WARNING: {stats.byLevel.WARNING}</div>
      <div>CRITICAL: {stats.byLevel.CRITICAL}</div>
      <div>
        중요 비율:{' '}
        {(stats.criticalRate * 100).toFixed(1)}%
      </div>
    </div>
  );
}
