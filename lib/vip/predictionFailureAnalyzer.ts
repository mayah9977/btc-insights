import { getExtremeHistory } from '@/lib/extreme/extremeHistoryStore'

export type FailureReason =
  | 'VOLATILITY_SPIKE'
  | 'FAKE_STABILITY'
  | 'DATA_LAG'
  | 'RARE_EVENT'

export function analyzePredictionFailure(): FailureReason[] {
  const history = getExtremeHistory()
  if (history.length < 5) return ['DATA_LAG']

  const recent = history.slice(-5)
  const avg =
    recent.reduce((a, b) => a + b.reliability, 0) /
    recent.length

  const reasons: FailureReason[] = []

  if (avg < 0.25) {
    reasons.push('VOLATILITY_SPIKE')
  }

  if (
    recent.some(
      (h) => h.reliability > 0.6
    )
  ) {
    reasons.push('FAKE_STABILITY')
  }

  if (Math.random() < 0.1) {
    reasons.push('RARE_EVENT')
  }

  return reasons.length
    ? reasons
    : ['DATA_LAG']
}
