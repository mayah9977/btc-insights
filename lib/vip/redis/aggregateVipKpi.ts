import { redis } from '@/lib/redis/index'
import { aggregateVipMetrics } from '@/lib/vip/aggregateVipMetrics'
import { aggregateRiskMetrics } from '@/lib/vip/metrics/aggregateRiskMetrics'

export type VipKpiSnapshot = {
  avoidedExtremeCount: number
  avoidedLossUSD: number
  weeklySummary: {
    period: '7d'
    avoidedLossUSD: number
    avoidedExtremeCount: number
  }
  monthlySummary: {
    period: '30d'
    avoidedLossUSD: number
    avoidedExtremeCount: number
  }
  updatedAt: number
}

// ---------------------------------------------
// ⭕ [ADD] Avoided Loss 제거 + Honest KPI 포함
// ---------------------------------------------
export type VipKpiSnapshotClean = {
  avoidedExtremeCount: number
  riskMetrics: {
    extremeCount: number
    highCount: number
    transitions: number
    stableRatio: number
  }
  weeklySummary: {
    period: '7d'
    avoidedExtremeCount: number
  }
  monthlySummary: {
    period: '30d'
    avoidedExtremeCount: number
  }
  updatedAt: number
}

const SOURCE_KEY = 'vip:risk-events'
const TARGET_KEY = 'vip:kpi:snapshot'

export async function aggregateDailyVipKpi() {
  // -------------------------------
  // ❌ 기존 list 기반 소스 (유지하되 사용하지 않음)
  // -------------------------------
  const raw = await redis.lrange(SOURCE_KEY, 0, -1)
  const _legacyEvents = raw.map(v => JSON.parse(v))

  // -------------------------------
  // ⭕ 신규 SSOT: Hash 기반 RiskEvent 집계
  // -------------------------------
  const keys = await redis.keys('vip:risk:event:*')

  const events = await Promise.all(
    keys.map(async (key) => {
      const e = await redis.hgetall(key)

      const riskLevel =
        e.riskLevel === 'LOW' ||
        e.riskLevel === 'MEDIUM' ||
        e.riskLevel === 'HIGH' ||
        e.riskLevel === 'EXTREME'
          ? e.riskLevel
          : 'LOW'

      return {
        riskLevel,
        entryPrice: Number(e.entryPrice),
        worstPrice: Number(e.worstPrice),
        position: e.position as 'LONG' | 'SHORT',
        timestamp: Number(e.timestamp),
        reason: e.reason,
      }
    }),
  )

  // -------------------------------
  // ✅ 기존 집계 로직 그대로 사용
  // ⭕ 타입 충돌 해결: 집계 지점에서만 명시적 단언
  // -------------------------------
  const typedEvents =
  events as import('@/lib/vip/redis/saveRiskEvent').RiskEvent[]

  const weekly = aggregateVipMetrics(typedEvents, 7)
  const monthly = aggregateVipMetrics(typedEvents, 30)

  // -------------------------------
  // ⭕ Honest Risk KPI (빈도 / 전이 / 안정성)
  // -------------------------------
  const riskMetrics = aggregateRiskMetrics(typedEvents)

  // -------------------------------
  // ⭕ Clean KPI Snapshot (공식 사용)
  // -------------------------------
  const snapshot: VipKpiSnapshotClean = {
    avoidedExtremeCount: monthly.avoidedExtremeCount,

    riskMetrics: {
      extremeCount: riskMetrics.extremeCount,
      highCount: riskMetrics.highCount,
      transitions: riskMetrics.transitions,
      stableRatio: riskMetrics.stableRatio,
    },

    weeklySummary: {
      period: '7d',
      avoidedExtremeCount: weekly.avoidedExtremeCount,
    },

    monthlySummary: {
      period: '30d',
      avoidedExtremeCount: monthly.avoidedExtremeCount,
    },

    updatedAt: Date.now(),
  }

  await redis.set(TARGET_KEY, JSON.stringify(snapshot))
}
