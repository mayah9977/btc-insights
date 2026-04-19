// /lib/push/pushOnAlert.ts
import { sendPushToUser } from './push'
import { getUserNotificationSettings } from '@/lib/notification/settingsStore'
import { getUserVIP } from '@/lib/auth/getUserVIP' // ✅ added VIP logic

export type PushAlertPayload = {
  userId: string
  alertId: string
  symbol: string
  price: number
  ts: number
  level?: 'NORMAL' | 'CRITICAL'
}

export type PushIndicatorPayload = {
  userId: string
  indicator: 'RSI' | 'MACD' | 'EMA'
  signal: string
  symbol: string
  value: number
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
 */
export async function pushAlertTriggered(
  payload: PushAlertPayload
) {
  const { userId, alertId, symbol, price, ts, level } = payload

  const settings = await getUserNotificationSettings(userId)

  if (!settings.pushEnabled) return

  if (
    settings.importance === 'CRITICAL_ONLY' &&
    level !== 'CRITICAL'
  ) {
    return
  }

  if (isQuietHour(settings.quietHours)) return

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

/**
 * 🔔 INDICATOR_SIGNAL → Push fan-out
 */
export async function pushIndicatorTriggered(
  payload: PushIndicatorPayload
) {
  const {
    userId,
    indicator,
    signal,
    symbol,
    value,
    ts,
    level,
  } = payload

  const settings = await getUserNotificationSettings(userId)

  if (!settings.pushEnabled) return

  if (
    settings.importance === 'CRITICAL_ONLY' &&
    level !== 'CRITICAL'
  ) {
    return
  }

  if (isQuietHour(settings.quietHours)) return

  // ✅ added VIP logic
  const isVIP = await getUserVIP(userId)
  if (!isVIP) {
    return
  }

  // ✅ added indicator filter
  if (
    settings.indicatorEnabled &&
    settings.indicatorEnabled[indicator] === false
  ) {
    return
  }

  await sendPushToUser(userId, {
    title: `📊 ${symbol} ${indicator}`,
    body: `${signal} · ${value.toFixed(2)}`,
    data: {
      type: 'INDICATOR_SIGNAL',
      indicator,
      signal,
      symbol,
      value: String(value),
      ts: String(ts),
    },
  })
}
