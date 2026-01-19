export type RiskEvent = {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'
  entryPrice: number
  worstPrice: number // 해당 시나리오 구간 내 최악 가격
  position: 'LONG' | 'SHORT'
}

export function calcAvoidedLossUSD(events: RiskEvent[]): number {
  return events
    .filter(e => e.riskLevel === 'HIGH' || e.riskLevel === 'EXTREME')
    .reduce((sum, e) => {
      const loss =
        e.position === 'LONG'
          ? e.entryPrice - e.worstPrice
          : e.worstPrice - e.entryPrice

      return sum + Math.max(loss, 0)
    }, 0)
}
