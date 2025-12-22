'use client';

import {
  markNotificationAsRead,
  isNotificationRead,
} from '@/lib/notification/notificationAck';

export function NotificationItem({
  id,
  message,
}: {
  id: string;
  message: string;
}) {
  const read = isNotificationRead(id);

  return (
    <div
      onClick={() => markNotificationAsRead(id)}
      className={`p-2 rounded cursor-pointer transition ${
        read
          ? 'opacity-50'
          : 'bg-yellow-50 hover:bg-yellow-100'
      }`}
    >
      {message}
    </div>
  );
}
