'use client'

import { useNotificationStore } from '@/lib/notification/notificationHistoryStore'
import type { RiskLevel } from '@/lib/vip/riskTypes'

/* =========================
 * Internal State
 * ========================= */

// 중복 알림 방지
let lastWhaleNotifiedAt: number | null = null
const NOTIFY_INTERVAL = 5 * 60 * 1000 // 5분

/* =========================
 * Types
 * ========================= */

type WhaleIntensityEvent = {
  symbol: string
  intensity: number
  avg: number
  trend: 'UP' | 'DOWN' | 'FLAT'
  isSpike: boolean
  riskLevel?: RiskLevel
  ts: number
}

type WhaleWarningEvent = {
  symbol: string
  whaleIntensity: number
  avgWhale: number
  tradeUSD?: number
  ts: number
}

/* =========================
 * 1️⃣ WHALE_INTENSITY 효과
 * ========================= */

export function handleWhaleIntensityEffect(
  event: WhaleIntensityEvent,
) {
  const {
    symbol,
    intensity,
    trend,
    isSpike,
    riskLevel,
    ts,
  } = event

  if (!isSpike) return
  if (riskLevel !== 'HIGH' && riskLevel !== 'EXTREME')
    return

  if (
    lastWhaleNotifiedAt &&
    ts - lastWhaleNotifiedAt < NOTIFY_INTERVAL
  ) {
    return
  }

  const notificationStore =
    useNotificationStore.getState()

  const level =
    riskLevel === 'EXTREME' ? 'CRITICAL' : 'WARNING'

  const trendText =
    trend === 'UP'
      ? '급격한 상승'
      : trend === 'DOWN'
      ? '급격한 하락'
      : '방향성 변화'

  notificationStore.record({
    level,
    message: `[🐋 고래 체결 급변] ${symbol} ${trendText} (강도 ${intensity.toFixed(
      2,
    )})`,
    at: ts,
  })

  lastWhaleNotifiedAt = ts
}

/* =========================
 * 2️⃣ WHALE_WARNING 효과
 * ========================= */

export function handleWhaleWarningEffect(
  event: WhaleWarningEvent,
) {
  const {
    symbol,
    whaleIntensity,
    avgWhale,
    tradeUSD,
    ts,
  } = event

  if (
    lastWhaleNotifiedAt &&
    ts - lastWhaleNotifiedAt < NOTIFY_INTERVAL
  ) {
    return
  }

  const notificationStore =
    useNotificationStore.getState()

  const usdText =
    typeof tradeUSD === 'number'
      ? ` / $${Math.round(tradeUSD).toLocaleString()}`
      : ''

  notificationStore.record({
    level: 'CRITICAL',
    message: `[🚨 고래 경보] ${symbol} 대량 체결 감지 (강도 ${whaleIntensity.toFixed(
      2,
    )}${usdText})`,
    at: ts,
  })

  lastWhaleNotifiedAt = ts
}
