'use client';

import { motion } from 'framer-motion';
import { pullNotifications } from '@/lib/notification/notificationQueue';

export function NotificationCenter() {
  const items = pullNotifications(20);
  const critical = items.filter(i => i.level === 'CRITICAL');

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-2">Notifications</h3>

      {critical.map((n, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-2 p-2 rounded bg-red-50 text-red-700"
        >
          {n.message}
          {n.reliability && (
            <span className="ml-2 text-xs opacity-70">
              {(n.reliability * 100).toFixed(0)}%
            </span>
          )}
        </motion.div>
      ))}
    </div>
  );
}
