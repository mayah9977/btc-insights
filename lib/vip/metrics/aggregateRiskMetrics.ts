import type { RiskEvent } from '@/lib/vip/redis/saveRiskEvent'

/**
 * Honest Risk KPI Aggregation
 *
 * ❌ 금액 기반 지표 제거
 * ⭕ 사건 / 빈도 / 전이 / 안정성 기반 KPI만 제공
 *
 * - EXTREME / HIGH 발생 횟수
 * - Risk Level 전이 횟수
 * - Stable(LOW) 구간 비율
 */
export function aggregateRiskMetrics(
  events: RiskEvent[],
) {
  if (!events.length) {
    return {
      extremeCount: 0,
      highCount: 0,
      transitions: 0,
      stableRatio: 0,
    }
  }

  // 시간순 정렬 (오래된 → 최신)
  const sorted = [...events].sort(
    (a, b) => a.timestamp - b.timestamp,
  )

  let extremeCount = 0
  let highCount = 0
  let transitions = 0
  let stableCount = 0

  let prevLevel: RiskEvent['riskLevel'] | null = null

  for (const e of sorted) {
    if (e.riskLevel === 'EXTREME') extremeCount++
    if (e.riskLevel === 'HIGH') highCount++
    if (e.riskLevel === 'LOW') stableCount++

    if (prevLevel && prevLevel !== e.riskLevel) {
      transitions++
    }

    prevLevel = e.riskLevel
  }

  const stableRatio =
    sorted.length > 0
      ? stableCount / sorted.length
      : 0

  return {
    extremeCount,
    highCount,
    transitions,
    stableRatio,
  }
}
