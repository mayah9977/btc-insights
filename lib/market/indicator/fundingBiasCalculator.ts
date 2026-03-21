/* =========================================================
  Funding Bias Calculator (Final)
========================================================= */

import { FundingBias } from '@/lib/market/store/vipMarketStore'

/* =========================================================
  Threshold Config
========================================================= */
const LONG_HEAVY_THRESHOLD = 0.001
const SHORT_HEAVY_THRESHOLD = -0.001

const EXTREME_THRESHOLD = 0.0025

/* =========================================================
  Derive Funding Bias
========================================================= */
export function deriveFundingBias(
  fundingRate: number,
): FundingBias {
  if (!Number.isFinite(fundingRate)) {
    return 'NEUTRAL'
  }

  /* 🔥 Extreme zone (optional tag 확장 가능) */
  if (fundingRate >= EXTREME_THRESHOLD) {
    return 'LONG_HEAVY'
  }

  if (fundingRate <= -EXTREME_THRESHOLD) {
    return 'SHORT_HEAVY'
  }

  /* =========================================================
    Normal Bias
  ========================================================= */
  if (fundingRate > LONG_HEAVY_THRESHOLD) {
    return 'LONG_HEAVY'
  }

  if (fundingRate < SHORT_HEAVY_THRESHOLD) {
    return 'SHORT_HEAVY'
  }

  return 'NEUTRAL'
}
