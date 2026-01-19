import { redis } from '@/lib/redis'
import type { VIP3Metrics } from '@/lib/vip/redis/getVIP3Metrics'

type MonthlyMetrics = {
  avoidedLossUSD: number
  avoidedExtremeCount: number
}

export async function buildVIPMonthlyReport(userId: string) {
  /**
   * 1️⃣ 월간 기본 성과 지표 (Redis Cron 집계)
   */
  const rawMonthly = await redis.get('vip:metrics:monthly')

  const monthly: MonthlyMetrics = rawMonthly
    ? JSON.parse(rawMonthly)
    : {
        avoidedLossUSD: 0,
        avoidedExtremeCount: 0,
      }

  /**
   * 2️⃣ VIP3 고급 지표 (없으면 null)
   */
  let vip3: VIP3Metrics | null = null

  try {
    const rawVIP3 = await redis.get('vip:metrics:vip3')
    if (rawVIP3) {
      vip3 = JSON.parse(rawVIP3)
    }
  } catch {
    // VIP3 지표 실패 시에도 리포트는 생성됨
  }

  /**
   * 3️⃣ 최종 리포트 데이터 (SSOT)
   */
  return {
    userId,
    month: new Date().toISOString().slice(0, 7),

    avoidedLossUSD: monthly.avoidedLossUSD,
    avoidedExtremeCount: monthly.avoidedExtremeCount,

    comment:
      monthly.avoidedExtremeCount > 0
        ? '이번 달 시장 리스크 회피 성과가 확인되었습니다.'
        : '이번 달은 큰 리스크가 제한적이었습니다.',

    vip3, // 🔥 VIP3 고급 지표 공식 포함
  }
}
