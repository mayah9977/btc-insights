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

  // ---------------------------------------------
  // ❌ Avoided Loss는 구조적으로 유효하지 않음
  // ⭕ calcAvoidedLossUSD 호출은 유지하되 결과는 사용하지 않음
  // ---------------------------------------------
  const _loss = calcAvoidedLossUSD(filtered)
  const loss = 0

  return {
    avoidedLossUSD: Math.round(loss ?? 0),
    avoidedExtremeCount: filtered.filter(
      e => e.riskLevel === 'EXTREME'
    ).length,
  }
}
