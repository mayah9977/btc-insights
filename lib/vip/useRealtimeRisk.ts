/**
 * ⚠️ DEPRECATED — DO NOT USE
 *
 * 이 훅은 과거 Risk 전용 SSE 구조에서 사용되었으며,
 * 현재 VIP 통합 SSE (/api/vip/stream) 구조에서는 완전히 폐기됨.
 *
 * ❌ /api/vip/realtime-risk 엔드포인트는 존재하지 않음
 * ❌ 이 훅을 사용하면 404가 발생함
 *
 * ✅ 대신 아래 훅을 사용해야 함:
 *    - useVipRealtime()
 *
 * 이 파일은 의도적으로 로직을 제거한 상태로 유지함
 * (실수로 다시 사용하는 것을 방지하기 위함)
 */

export type RiskLevel =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'EXTREME'

export type RealtimeRiskState = {
  riskLevel: RiskLevel
  updatedAt: number
}

export function useRealtimeRisk(): RealtimeRiskState {
  if (process.env.NODE_ENV !== 'production') {
    console.error(
      '[DEPRECATED] useRealtimeRisk is removed. Use useVipRealtime() instead.',
    )
  }

  // 안전한 더미 반환 (렌더링 크래시 방지)
  return {
    riskLevel: 'LOW',
    updatedAt: Date.now(),
  }
}
