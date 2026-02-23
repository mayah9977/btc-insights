/* =========================================================
   Internal On-chain Metrics (DISABLED)
   - Deprecated: Numerical snapshot engine removed
   - Replaced by Institutional RSS Intelligence
========================================================= */

export interface OnchainMetricsSnapshot {
  exchangeNetflow: number
  activeAddresses: number
  sopr: number
  mvrv: number
  whaleBalanceChange: number
}

/* 🔥 완전 비활성화 */
export async function fetchOnchainMetrics(): Promise<OnchainMetricsSnapshot> {
  console.warn('[OnchainMetrics] Internal metrics engine disabled')

  return {
    exchangeNetflow: 0,
    activeAddresses: 0,
    sopr: 0,
    mvrv: 0,
    whaleBalanceChange: 0,
  }
}