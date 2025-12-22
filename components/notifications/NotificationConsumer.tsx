'use client';

import { useEffect } from 'react';
import { pullNotifications } from '@/lib/notification/notificationQueue';
import { processNotification } from '@/lib/notification/processNotification';
import { useVIP } from '@/lib/vip/vipClient';

export function NotificationConsumer() {
  const { vipLevel } = useVIP();

  useEffect(() => {
    const timer = setInterval(() => {
      const items = pullNotifications();

      items.forEach((item) => {
        processNotification(item, {
          isVIP3: vipLevel === 'VIP3',
        });
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [vipLevel]);

  return null;
}
