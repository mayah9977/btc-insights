/**
 * =========================================================
 * ❌ DEPRECATED
 * Internal Sentiment Engine Disabled
 *
 * Fear & Greed index is now sourced from:
 * Alternative.me Official API
 *
 * Do NOT use computeSentiment().
 * =========================================================
 */

import type { RealtimeRiskSnapshot } from './buildRiskInputFromRealtime'

export function computeSentiment(
  _snapshot: RealtimeRiskSnapshot,
): number {
  console.warn(
    '[SentimentEngine] Disabled. Using Alternative.me official index instead.',
  )

  // 항상 중립값 반환 (안전)
  return 50
}