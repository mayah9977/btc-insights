import { redis } from '@/lib/redis/index'
import { aggregateVipMetrics } from '@/lib/vip/aggregateVipMetrics'
import { aggregateRiskMetrics } from '@/lib/vip/metrics/aggregateRiskMetrics'

/* =========================================================
   Clean Snapshot (BTC Insight SSOT 전용)
========================================================= */
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

/* ========================================================= */

const TARGET_KEY = 'vip:kpi:snapshot'

export async function aggregateDailyVipKpi() {
  /* =========================================================
     1️⃣ Hash 기반 RiskEvent SSOT
  ========================================================= */

  const keys = await redis.keys('vip:risk:event:*')

  if (!keys.length) {
    await redis.set(
      TARGET_KEY,
      JSON.stringify({
        avoidedExtremeCount: 0,
        riskMetrics: {
          extremeCount: 0,
          highCount: 0,
          transitions: 0,
          stableRatio: 0,
        },
        weeklySummary: {
          period: '7d',
          avoidedExtremeCount: 0,
        },
        monthlySummary: {
          period: '30d',
          avoidedExtremeCount: 0,
        },
        updatedAt: Date.now(),
      }),
    )

    return
  }

  const events = await Promise.all(
    keys.map(async (key) => {
      const e = await redis.hgetall(key)

      const riskLevel =
        e.riskLevel === 'LOW' ||
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

  const typedEvents =
    events as import('@/lib/vip/redis/saveRiskEvent').RiskEvent[]

  /* =========================================================
     2️⃣ 7d / 30d 집계 (기존 로직 유지)
  ========================================================= */

  const weekly = aggregateVipMetrics(typedEvents, 7)
  const monthly = aggregateVipMetrics(typedEvents, 30)

  /* =========================================================
     3️⃣ Honest Risk KPI (StableRatio / Transition 출처)
     👉 aggregateRiskMetrics 가 단일 출처(SSOT)
  ========================================================= */

  const riskMetrics = aggregateRiskMetrics(typedEvents)

  /* =========================================================
     4️⃣ Clean Snapshot 저장
  ========================================================= */

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

  // 🔥 48시간 TTL (안정형)
  await redis.set(
    TARGET_KEY,
    JSON.stringify(snapshot),
    'EX',
    60 * 60 * 48,
  )
}
