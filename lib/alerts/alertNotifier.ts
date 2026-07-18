//lib/alerts/alertNotifier.ts

import type { PriceAlert } from './alertTypes'
import { sendPush } from '../push/pushSender'

/**
 * ALERT_TRIGGERED → FCM Push
 * - Toast 이후 Secondary UX
 * - 실패해도 Alert Engine 흐름에 영향 없음
 */
export async function sendAlertNotification(
  alert: PriceAlert,
  hitPrice: number,
) {
  console.log('[NOTIFIER] sendAlertNotification', alert.id)

  const symbol = alert.symbol.toUpperCase()

  const title =
    alert.condition === 'ABOVE'
      ? '🚀 가격 상단 돌파'
      : alert.condition === 'BELOW'
      ? '📉 가격 하단 이탈'
      : alert.condition === 'PERCENT_UP'
      ? '📈 퍼센트 상승 알림'
      : alert.condition === 'PERCENT_DOWN'
      ? '📉 퍼센트 하락 알림'
      : alert.condition === 'REACH'
      ? '🎯 목표가 도달'
      : '🔔 가격 알림'

  const body = `${symbol} 조건 충족\n현재가: ${hitPrice}`

  await sendPush({
    userId: alert.userId,
    title,
    body,
    data: {
      // ✅ FCM은 string-only payload
      type: 'ALERT_TRIGGERED',
      alertId: alert.id,
      symbol: alert.symbol,
      price: String(hitPrice),
      condition: alert.condition,
    },
  })
}
