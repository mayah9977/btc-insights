import type { RiskEvent } from '@/lib/vip/redis/saveRiskEvent'

export function calcExtremeAvoidanceRate(
  events: RiskEvent[],
): number | null {
  if (!events.length) return null

  const extremeEvents = events.filter(
    (e) => e.riskLevel === 'EXTREME',
  )

  if (!extremeEvents.length) return null

  /**
   * 회피 성공 조건:
   * - worstPrice가 entryPrice보다 불리하게 움직였음
   * - 즉, 진입했다면 손실이 났을 구간
   */
  const avoided = extremeEvents.filter(
    (e) => Math.abs(e.worstPrice - e.entryPrice) > 0,
  )

  return (avoided.length / extremeEvents.length) * 100
}
