import { redis } from '@/lib/redis/index'
import { aggregateVipMetrics } from '@/lib/vip/aggregateVipMetrics'

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

const SOURCE_KEY = 'vip:risk-events'
const TARGET_KEY = 'vip:kpi:snapshot'

export async function aggregateDailyVipKpi() {
  const raw = await redis.lrange(SOURCE_KEY, 0, -1)
  const events = raw.map(v => JSON.parse(v))

  const weekly = aggregateVipMetrics(events, 7)
  const monthly = aggregateVipMetrics(events, 30)

  const snapshot: VipKpiSnapshot = {
    avoidedExtremeCount: monthly.avoidedExtremeCount,
    avoidedLossUSD: monthly.avoidedLossUSD,

    weeklySummary: {
      period: '7d',
      avoidedLossUSD: weekly.avoidedLossUSD,
      avoidedExtremeCount: weekly.avoidedExtremeCount,
    },

    monthlySummary: {
      period: '30d',
      avoidedLossUSD: monthly.avoidedLossUSD,
      avoidedExtremeCount: monthly.avoidedExtremeCount,
    },

    updatedAt: Date.now(),
  }

  await redis.set(TARGET_KEY, JSON.stringify(snapshot))
}
