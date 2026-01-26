// lib/vip/aggregateVipMetrics.ts

import { calcAvoidedLossUSD, RiskEvent } from './calcAvoidedLoss'

export function aggregateVipMetrics(
  events: (RiskEvent & { timestamp: number })[],
  days: 7 | 30
) {
  const now = Date.now()
  const range = days * 24 * 60 * 60 * 1000

  const filtered = events.filter(
    e => now - e.timestamp <= range
  )

  const loss = calcAvoidedLossUSD(filtered)

  return {
    avoidedLossUSD: Math.round(loss ?? 0),
    avoidedExtremeCount: filtered.filter(
      e => e.riskLevel === 'EXTREME'
    ).length,
  }
}
