'use client';

import {
  getNotificationHistory,
  getNotificationStats,
} from '@/lib/notification/notificationHistoryStore';

export function NotificationHistoryView() {
  const list = getNotificationHistory();
  const stats = getNotificationStats();

  return (
    <section className="p-4">
      <h2 className="font-bold mb-2">Notification History</h2>

      <div className="text-sm mb-3">
        전체 {stats.total} /
        INFO {stats.INFO} /
        WARNING {stats.WARNING} /
        CRITICAL {stats.CRITICAL}
      </div>

      <ul className="space-y-1 text-sm">
        {list.map((n, i) => (
          <li key={i} className="border-b pb-1">
            [{n.level}] {n.message}
          </li>
        ))}
      </ul>
    </section>
  );
}
