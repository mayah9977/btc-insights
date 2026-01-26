import { redis } from '@/lib/redis/index'
import type { VipKpiSnapshot } from './aggregateVipKpi'

const EMPTY: VipKpiSnapshot = {
  avoidedExtremeCount: 0,
  avoidedLossUSD: 0,
  weeklySummary: {
    period: '7d',
    avoidedLossUSD: 0,
    avoidedExtremeCount: 0,
  },
  monthlySummary: {
    period: '30d',
    avoidedLossUSD: 0,
    avoidedExtremeCount: 0,
  },
  updatedAt: 0,
}

export async function getVipKpiSnapshot(): Promise<VipKpiSnapshot> {
  const raw = await redis.get('vip:kpi:snapshot')
  if (!raw) return EMPTY

  try {
    return JSON.parse(raw)
  } catch {
    return EMPTY
  }
}
