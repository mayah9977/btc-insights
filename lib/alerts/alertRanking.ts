import { listPerformances } from './alertPerformanceStore'

export async function rankAlerts(userId: string) {
  const perf = await listPerformances(userId)

  const map: Record<string, any> = {}

  for (const p of perf) {
    if (!map[p.alertId]) {
      map[p.alertId] = {
        alertId: p.alertId,
        symbol: p.symbol,
        count: 0,
        hit: 0,
        pnl: [],
      }
    }

    map[p.alertId].count++
    if (p.hit) map[p.alertId].hit++
    if (p.pnlPercent !== undefined)
      map[p.alertId].pnl.push(p.pnlPercent)
  }

  return Object.values(map)
    .map(v => ({
      ...v,
      hitRate: v.hit / v.count,
      avgPnL:
        v.pnl.reduce((a: number, b: number) => a + b, 0) /
        (v.pnl.length || 1),
    }))
    .sort((a, b) => b.avgPnL - a.avgPnL)
}
