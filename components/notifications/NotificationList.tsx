'use client';

import { pullNotifications } from '@/lib/notification/notificationQueue';

export function NotificationList() {
  const items = pullNotifications();

  return (
    <ul>
      {items.map((n, i) => (
        <li key={i}>
          [{n.level}] {n.message}
          {n.reliability !== undefined && (
            <span style={{ marginLeft: 8, opacity: 0.7 }}>
              신뢰도 {(n.reliability * 100).toFixed(0)}%
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
