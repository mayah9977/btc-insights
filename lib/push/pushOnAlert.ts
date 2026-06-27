// lib/push/pushOnAlert.ts

import { sendPushToUser } from './push'
import { getUserNotificationSettings } from '@/lib/notification/settingsStore'
import {
  getUserVIPLevel,
  getUserVIPLevelByUserIdOnly,
} from '@/lib/vip/vipServer'

export type PushAlertPayload = {
  userId: string
  alertId: string
  symbol: string
  price: number
  ts: number
  level?: 'NORMAL' | 'CRITICAL'
}

export type PushIndicatorTimeframe =
  | '15m'
  | '1h'

export type PushIndicatorPayload = {
  userId: string
  indicator: 'RSI' | 'MACD' | 'EMA'
  signal: string
  symbol: string
  value: number
  ts: number
  timeframe?: PushIndicatorTimeframe
  eventCandleTs?: number
  level?: 'NORMAL' | 'CRITICAL'
  runtime?: 'request' | 'worker'
}

/**
 * ⏰ Quiet Hour 판별
 */
function isQuietHour(
  q?: { from: number; to: number },
) {
  if (!q) return false

  const h = new Date().getHours()

  return q.from <= q.to
    ? h >= q.from && h < q.to
    : h >= q.from || h < q.to
}

function normalizeTimeframe(
  value: unknown,
): PushIndicatorTimeframe {
  return value === '1h'
    ? '1h'
    : '15m'
}

function isIndicatorTimeframeEnabled(
  value: unknown,
  timeframe: PushIndicatorTimeframe,
) {
  /**
   * Legacy migration-safe guard:
   *
   * 기존 persisted schema:
   * indicatorEnabled.RSI = true | false
   *
   * 신규 schema:
   * indicatorEnabled.RSI = {
   *   '15m': boolean,
   *   '1h': boolean,
   * }
   */
  if (typeof value === 'boolean') {
    return value
  }

  if (
    !value ||
    typeof value !== 'object'
  ) {
    return true
  }

  const candidate =
    value as Partial<
      Record<
        PushIndicatorTimeframe,
        unknown
      >
    >

  const enabled =
    candidate[timeframe]

  return typeof enabled === 'boolean'
    ? enabled
    : true
}

function buildIndicatorPushBody(
  indicator: PushIndicatorPayload['indicator'],
  signal: string,
  timeframe: PushIndicatorTimeframe,
  value: number,
) {
  const structureMode =
    timeframe === '1h'

  const SIGNAL_LABELS: Record<
    string,
    Record<string, string>
  > = {
    RSI: {
      RSI_OVERBOUGHT: structureMode
        ? 'Structure Overheat'
        : 'Momentum Shift',

      RSI_OVERSOLD: structureMode
        ? 'Structure Compression'
        : 'Momentum Transition',
    },

    MACD: {
      GOLDEN_CROSS: structureMode
        ? 'Structure Alignment'
        : 'Momentum Shift',

      DEAD_CROSS: structureMode
        ? 'Directional Structure Shift'
        : 'Momentum Transition',
    },

    EMA: {
      BULLISH_TREND: structureMode
        ? 'Structure Alignment'
        : 'Momentum Shift',

      BEARISH_TREND: structureMode
        ? 'Directional Structure Shift'
        : 'Momentum Transition',
    },
  }

  const label =
    SIGNAL_LABELS[indicator]?.[
      signal
    ] ??
    signal

  return `[${timeframe.toUpperCase()}] ${label} · ${value.toFixed(
    2,
  )}`
}

/**
 * 🔔 ALERT_TRIGGERED → Push fan-out
 */
export async function pushAlertTriggered(
  payload: PushAlertPayload,
) {
  const {
    userId,
    alertId,
    symbol,
    price,
    ts,
    level,
  } = payload

  const settings =
    await getUserNotificationSettings(
      userId,
    )

  if (!settings.pushEnabled) return

  if (
    settings.importance ===
      'CRITICAL_ONLY' &&
    level !== 'CRITICAL'
  ) {
    return
  }

  if (
    isQuietHour(settings.quietHours)
  )
    return

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
  payload: PushIndicatorPayload,
) {
  const {
    userId,
    indicator,
    signal,
    symbol,
    value,
    ts,
    timeframe,
    eventCandleTs,
    level,
    runtime,
  } = payload

  const settings =
    await getUserNotificationSettings(
      userId,
    )

  if (!settings.pushEnabled) return

  if (
    settings.importance ===
      'CRITICAL_ONLY' &&
    level !== 'CRITICAL'
  ) {
    return
  }

  if (
    isQuietHour(settings.quietHours)
  )
    return

  // ✅ VIP 체크 (userId 기반)
  const vipLevel =
    runtime === 'worker'
      ? await getUserVIPLevelByUserIdOnly(userId)
      : await getUserVIPLevel(userId)

  const isVIP =
    vipLevel === 'VIP'

  if (!isVIP) {
    return
  }

  const normalizedTimeframe =
    normalizeTimeframe(timeframe)

  // ✅ indicator + timeframe 필터
  if (
    settings.indicatorEnabled &&
    !isIndicatorTimeframeEnabled(
      settings.indicatorEnabled[
        indicator
      ],
      normalizedTimeframe,
    )
  ) {
    return
  }

  const body =
    buildIndicatorPushBody(
      indicator,
      signal,
      normalizedTimeframe,
      value,
    )

  await sendPushToUser(userId, {
    title: `📊 ${symbol} ${indicator} [${normalizedTimeframe.toUpperCase()}]`,
    body,
    data: {
      type: 'INDICATOR_SIGNAL',
      indicator,
      signal,
      symbol,
      timeframe:
        normalizedTimeframe,
      eventCandleTs: String(
        eventCandleTs ?? ts,
      ),
      value: String(value),
      ts: String(ts),
    },
  })
}
