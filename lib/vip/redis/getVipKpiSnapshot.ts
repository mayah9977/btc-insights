import { redis } from '@/lib/redis/index'
import type { VipKpiSnapshotClean } from './aggregateVipKpi'

/* =========================================================
   ✅ Clean Snapshot 기준 EMPTY 값
========================================================= */
const EMPTY: VipKpiSnapshotClean = {
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

  updatedAt: 0,
}

/* ========================================================= */

export async function getVipKpiSnapshot(): Promise<VipKpiSnapshotClean> {
  const raw = await redis.get('vip:kpi:snapshot')
  if (!raw) return EMPTY

  try {
    const parsed = JSON.parse(raw)
    return parsed as VipKpiSnapshotClean
  } catch {
    return EMPTY
  }
}
