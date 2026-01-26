import type { RiskEvent } from '@/lib/vip/redis/saveRiskEvent'

export function generateDailyAvoidedLossSummary(
  events: RiskEvent[],
): string | null {
  if (!events.length) return null

  /**
   * 🔥 오늘 시작 시각 (서버 타임존 기준)
   * - UTC/KST 하드코딩 ❌
   * - 서버 환경에 자동 적응 (가장 안전)
   */
  const now = new Date()
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  ).getTime()

  /**
   * ✅ 오늘 발생한 EXTREME Risk만 필터
   */
  const todayExtremeEvents = events.filter(
    (e) =>
      e.riskLevel === 'EXTREME' &&
      e.timestamp >= startOfToday,
  )

  if (!todayExtremeEvents.length) return null

  /**
   * ✅ 오늘 회피한 총 손실 계산
   */
  const totalAvoidedLoss = todayExtremeEvents.reduce(
    (sum, e) =>
      sum + Math.abs(e.worstPrice - e.entryPrice),
    0,
  )

  return `오늘 VIP는 EXTREME 리스크 ${todayExtremeEvents.length}회를 회피해 약 $${totalAvoidedLoss.toLocaleString()}의 손실을 피했습니다`
}
