import type { RiskEvent } from '@/lib/vip/redis/saveRiskEvent'

export function generateDailyAvoidedLossDelta(
  events: RiskEvent[],
): number | null {
  if (!events.length) return null

  const now = new Date()

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime()

  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000

  const todayExtreme = events.filter(
    (e) =>
      e.riskLevel === 'EXTREME' &&
      e.timestamp >= startOfToday,
  )

  const yesterdayExtreme = events.filter(
    (e) =>
      e.riskLevel === 'EXTREME' &&
      e.timestamp >= startOfYesterday &&
      e.timestamp < startOfToday,
  )

  if (!yesterdayExtreme.length) return null

  const todayLoss = todayExtreme.reduce(
    (s, e) => s + Math.abs(e.worstPrice - e.entryPrice),
    0,
  )

  const yesterdayLoss = yesterdayExtreme.reduce(
    (s, e) => s + Math.abs(e.worstPrice - e.entryPrice),
    0,
  )

  if (yesterdayLoss === 0) return null

  return ((todayLoss - yesterdayLoss) / yesterdayLoss) * 100
}
