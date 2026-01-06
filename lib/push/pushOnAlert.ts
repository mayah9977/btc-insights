// lib/push/pushOnAlert.ts
import { sendPushToUser } from './push'
import { getUserNotificationSettings } from '@/lib/notification/settingsStore'

export type PushAlertPayload = {
  userId: string
  alertId: string
  symbol: string
  price: number
  ts: number
  level?: 'NORMAL' | 'CRITICAL'
}

/**
 * ⏰ Quiet Hour 판별
 */
function isQuietHour(
  q?: { from: number; to: number }
) {
  if (!q) return false
  const h = new Date().getHours()

  return q.from <= q.to
    ? h >= q.from && h < q.to
    : h >= q.from || h < q.to
}

/**
 * 🔔 ALERT_TRIGGERED → Push fan-out
 * - 서버 설정 기반 필터
 * - FCM data payload는 string-only
 */
export async function pushAlertTriggered(
  payload: PushAlertPayload
) {
  const { userId, alertId, symbol, price, ts, level } = payload

  /* =========================
   * 🔒 User Push Settings
   * ========================= */
  const settings = await getUserNotificationSettings(userId)

  // Push OFF
  if (!settings.pushEnabled) return

  // 중요 알림만
  if (
    settings.importance === 'CRITICAL_ONLY' &&
    level !== 'CRITICAL'
  ) {
    return
  }

  // 방해금지 시간
  if (isQuietHour(settings.quietHours)) return

  /* =========================
   * 🔥 Push Send
   * ========================= */
  await sendPushToUser(userId, {
    title: `🚨 ${symbol} ALERT`,
    body: `${price.toLocaleString()} USDT 도달`,
    data: {
      type: 'ALERT_TRIGGERED',
      alertId,
      symbol,
      price: String(price),
      ts: String(ts),
    },
  })
}
