import { redis } from '@/lib/redis/index'
import { aggregateVipMetrics } from '@/lib/vip/aggregateVipMetrics'
import { aggregateRiskMetrics } from '@/lib/vip/metrics/aggregateRiskMetrics'

/* =========================================================
   ✅ Legacy 타입 (getVipKpiSnapshot.ts 호환용)
   👉 반드시 export 필요 (빌드 에러 해결)
========================================================= */
export type VipKpiSnapshot = {
  avoidedExtremeCount: number
  totalSignals: number
  winRate: number
  lastUpdated: string | null
}

/* =========================================================
   ✅ Clean Snapshot (현재 SSOT 구조)
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
  const keys = await redis.keys('vip:risk:event:*')

  if (!keys.length) {
    const emptySnapshot: VipKpiSnapshotClean = {
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
    }

    await redis.set(
      TARGET_KEY,
      JSON.stringify(emptySnapshot),
      'EX',
      60 * 60 * 48,
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

  const weekly = aggregateVipMetrics(typedEvents, 7)
  const monthly = aggregateVipMetrics(typedEvents, 30)
  const riskMetrics = aggregateRiskMetrics(typedEvents)

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

  await redis.set(
    TARGET_KEY,
    JSON.stringify(snapshot),
    'EX',
    60 * 60 * 48,
  )
}
