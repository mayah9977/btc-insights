import type { NotificationItem } from './notificationTypes'
import { playNotificationFeedback } from './notificationFeedback'
import { recordNotification } from './notificationHistoryStore'

/**
 * 🔔 Notification processing unit (SSOT - UI consumption stage)
 *
 * Responsibilities:
 * 1. Notification history record
 * 2. Voice/vibration feedback for VIP only
 * 3. (Future) analytics/server logging extension point
 */
export function processNotification(
  item: NotificationItem,
  opts: {
    isVIP: boolean
  }
) {
  /**
   * 1️⃣ Notification record (Important)
   */
  recordNotification(item)

  /**
   * 2️⃣ VIP only feedback
   */
  playNotificationFeedback(item.level, opts.isVIP)

  /**
   * 3️⃣ Expansion points
   */
}
