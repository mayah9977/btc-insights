import { NextResponse } from 'next/server'
import { redis } from '@/lib/redis'
import type { RiskEvent } from '@/lib/vip/redis/saveRiskEvent'

/**
 * 날짜 경계 계산 (UTC 기준, 서버 타임존 무관)
 */
function getUtcDayRange(offsetDays = 0) {
  const now = new Date()

  const start = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + offsetDays,
      0, 0, 0, 0,
    ),
  )

  const end = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + offsetDays,
      23, 59, 59, 999,
    ),
  )

  return { start: start.getTime(), end: end.getTime() }
}

export async function GET() {
  const keys = await redis.keys('vip:risk:event:*')

  const events: RiskEvent[] = []

  for (const key of keys) {
    const data = await redis.hgetall(key)
    if (!data?.timestamp) continue

    events.push({
      riskLevel: data.riskLevel as RiskEvent['riskLevel'],
      entryPrice: Number(data.entryPrice),
      worstPrice: Number(data.worstPrice),
      position: data.position as RiskEvent['position'],
      timestamp: Number(data.timestamp),
      reason: data.reason || undefined,
    })
  }

  /* =========================
   * 1️⃣ 오늘 회피 손실 (USD)
   * ========================= */
  const today = getUtcDayRange(0)

  const todayExtreme = events.filter(
    e =>
      e.riskLevel === 'EXTREME' &&
      e.timestamp >= today.start &&
      e.timestamp <= today.end,
  )

  const todayAvoidedLossUSD = todayExtreme.reduce(
    (sum, e) => sum + Math.abs(e.worstPrice - e.entryPrice),
    0,
  )

  /* =========================
   * 2️⃣ 어제 대비 변화율 (%)
   * ========================= */
  const yesterday = getUtcDayRange(-1)

  const yesterdayExtreme = events.filter(
    e =>
      e.riskLevel === 'EXTREME' &&
      e.timestamp >= yesterday.start &&
      e.timestamp <= yesterday.end,
  )

  const yesterdayAvoidedLossUSD = yesterdayExtreme.reduce(
    (sum, e) => sum + Math.abs(e.worstPrice - e.entryPrice),
    0,
  )

  const yesterdayDeltaPercent =
    yesterdayAvoidedLossUSD === 0
      ? null
      : Number(
          (
            ((todayAvoidedLossUSD - yesterdayAvoidedLossUSD) /
              yesterdayAvoidedLossUSD) *
            100
          ).toFixed(2),
        )

  /* =========================
   * 3️⃣ EXTREME 회피 성공률 (%)
   * ========================= */
  const extremeTotal = events.filter(
    e => e.riskLevel === 'EXTREME',
  ).length

  const extremeFailed = events.filter(
    e =>
      e.riskLevel === 'EXTREME' &&
      Math.abs(e.worstPrice - e.entryPrice) > 0,
  ).length

  const extremeAvoidanceRate =
    extremeTotal === 0
      ? null
      : Number(
          (
            ((extremeTotal - extremeFailed) / extremeTotal) *
            100
          ).toFixed(2),
        )

  return NextResponse.json({
    todayAvoidedLossUSD: Math.round(todayAvoidedLossUSD),
    yesterdayDeltaPercent, // number | null
    extremeAvoidanceRate,  // number | null
  })
}
