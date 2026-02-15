'use server'

import { getRecentPrices } from '@/lib/market/marketLastStateStore'

/**
 * 🔥 Realtime Volatility Calculator (SSOT)
 *
 * - Based on log return
 * - Only use the most recent N prices.
 * - Extreme pre-detection purpose
 *
 * return: 0 to 1 (normalized)
 */
export async function calculateVolatilityFromCandles(
  symbol: string,
  windowSize: number = 20,
): Promise<number | null> {
  /**
   * 1️⃣ Recent real-time price sequence
   * - Based on PRICE_TICK
   */
  const prices = getRecentPrices(symbol, windowSize + 1)

  if (!prices || prices.length < windowSize + 1) {
    return null
  }

  /**
   * 2️⃣ Calculate Log Returns
   */
  const logReturns: number[] = []

  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1]
    const curr = prices[i]

    if (!Number.isFinite(prev) || !Number.isFinite(curr) || prev <= 0) {
      return null
    }

    logReturns.push(Math.log(curr / prev))
  }

  if (logReturns.length < windowSize) {
    return null
  }

  /**
   * 3️⃣ Standard Deviation (Realized Volatility)
   */
  const mean =
    logReturns.reduce((a, b) => a + b, 0) / logReturns.length

  const variance =
    logReturns.reduce((sum, r) => {
      const diff = r - mean
      return sum + diff * diff
    }, 0) / logReturns.length

  const stdDev = Math.sqrt(variance)

  /**
   * 4️⃣ Normalization (based on BTC actual use)
   * - Normal time: 0.05 ~ 0.15
   * - Increased volatility: 0.3+
   * - Extreme candidate: 0.6+
   */
  const NORMALIZATION_FACTOR = 0.08

  // 🔧 문법 오류 수정 (세미콜론 → 콤마)
  const normalizedVolatility = Math.min(
    stdDev / NORMALIZATION_FACTOR,
    1,
  )

  return normalizedVolatility
}
