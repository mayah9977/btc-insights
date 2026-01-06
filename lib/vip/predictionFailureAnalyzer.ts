import { getExtremeHistory } from '@/lib/extreme/extremeHistoryStore'

export type FailureReason =
  | 'VOLATILITY_SPIKE'
  | 'FAKE_STABILITY'
  | 'DATA_LAG'
  | 'RARE_EVENT'

/**
 * 예측 실패 원인 분석
 * - 결정론적
 * - VIP 설명용
 */
export function analyzePredictionFailure(): FailureReason[] {
  const history = getExtremeHistory()

  // 데이터 부족
  if (history.length < 5) {
    return ['DATA_LAG']
  }

  const recent = history.slice(-5)
  const avgReliability =
    recent.reduce((a, b) => a + b.reliability, 0) /
    recent.length

  const reasons: FailureReason[] = []

  // 변동성 급증 → 예측 붕괴
  if (avgReliability < 0.25) {
    reasons.push('VOLATILITY_SPIKE')
  }

  // 고신뢰 → 급변 (가짜 안정)
  if (recent.some((h) => h.reliability > 0.65)) {
    reasons.push('FAKE_STABILITY')
  }

  // 극단적 outlier
  if (
    recent.every(
      (h) => h.reliability < 0.15
    )
  ) {
    reasons.push('RARE_EVENT')
  }

  return reasons.length
    ? reasons
    : ['DATA_LAG']
}
