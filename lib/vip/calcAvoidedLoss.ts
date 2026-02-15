export type RiskEvent = {
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'
  entryPrice: number
  worstPrice: number // 해당 시나리오 구간 내 최악 가격
  position: 'LONG' | 'SHORT'
}

export function calcAvoidedLossUSD(events: RiskEvent[]): number {
  // ❌ Avoided Loss는 구조적으로 유효하지 않음
  // ⭕ KPI / 집계 파이프라인 호환을 위해 항상 0 반환
  return 0

  // ---------------------------------------------
  // ⛔ 기존 로직 (보존 대상, 실행되지 않음)
  // ---------------------------------------------
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
