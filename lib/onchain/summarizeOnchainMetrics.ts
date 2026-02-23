/* =========================================================
   Internal On-chain Metrics Summarizer (DISABLED)
   - Deprecated
   - Institutional RSS engine replaces numeric summary
========================================================= */

import type { OnchainMetricsSnapshot } from './fetchOnchainMetrics'

export async function summarizeOnchainMetrics(
  metrics: OnchainMetricsSnapshot,
): Promise<string> {

  console.warn('[OnchainSummarizer] Internal metrics summarizer disabled')

  return `
• 내부 수치 기반 온체인 엔진은 현재 비활성화되었습니다.
• 기관 리서치 기반 온체인 인텔리전스가 적용됩니다.
`.trim()
}