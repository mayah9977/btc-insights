/* ======================================================
 * Bollinger Bands Calculation Utility
 * Timeframe: 30m Candle Close
 * Default: Period 20 / StdDev 2
 *
 * ⚠️ Role
 * - 순수 계산 유틸
 * - 해석 ❌ / 판단 ❌ / 신호 ❌
 * - Action Gate에서는 결과만 참조
 * ====================================================== */

export interface BollingerInput {
  closes: number[]            // 최근 종가 배열 (오래된 → 최신)
  period?: number             // default: 20
  stdDevMultiplier?: number   // default: 2
}

export interface BollingerResult {
  // 계산 결과
  middleBand: number          // SMA (계산은 하되 사용 강제 ❌)
  upperBand: number
  lowerBand: number
  stdDev: number

  // 구조 보조 정보
  upperSlope?: number         // 상단 밴드 기울기
  lowerSlope?: number         // 하단 밴드 기울기

  isReady: boolean            // period 충족 여부
}

/* -----------------------------
 * Core Calculation
 * ----------------------------- */
export function calculateBollingerBands(
  input: BollingerInput
): BollingerResult {
  const {
    closes,
    period = 20,
    stdDevMultiplier = 2,
  } = input

  // 데이터 부족 시 (계산 불가)
  if (closes.length < period) {
    return {
      middleBand: 0,
      upperBand: 0,
      lowerBand: 0,
      stdDev: 0,
      isReady: false,
    }
  }

  // 최근 period 만큼만 사용
  const slice = closes.slice(-period)

  // =============================
  // SMA (Middle Band)
  // =============================
  const mean =
    slice.reduce((sum, price) => sum + price, 0) / period

  // =============================
  // Standard Deviation
  // =============================
  const variance =
    slice.reduce(
      (sum, price) => sum + Math.pow(price - mean, 2),
      0,
    ) / period

  const stdDev = Math.sqrt(variance)

  const upperBand = mean + stdDevMultiplier * stdDev
  const lowerBand = mean - stdDevMultiplier * stdDev

  // =============================
  // Slope (optional, 구조 판별용)
  // - 직전 period 대비 변화량
  // =============================
  let upperSlope: number | undefined
  let lowerSlope: number | undefined

  if (closes.length >= period + 1) {
    const prevSlice = closes.slice(
      -(period + 1),
      -1,
    )

    const prevMean =
      prevSlice.reduce((sum, price) => sum + price, 0) /
      period

    const prevVariance =
      prevSlice.reduce(
        (sum, price) =>
          sum + Math.pow(price - prevMean, 2),
        0,
      ) / period

    const prevStdDev = Math.sqrt(prevVariance)

    const prevUpper =
      prevMean + stdDevMultiplier * prevStdDev
    const prevLower =
      prevMean - stdDevMultiplier * prevStdDev

    upperSlope = round(upperBand - prevUpper, 6)
    lowerSlope = round(lowerBand - prevLower, 6)
  }

  return {
    middleBand: round(mean),
    upperBand: round(upperBand),
    lowerBand: round(lowerBand),
    stdDev: round(stdDev),
    upperSlope,
    lowerSlope,
    isReady: true,
  }
}

/* -----------------------------
 * Helper
 * ----------------------------- */
function round(value: number, decimals = 2): number {
  const factor = Math.pow(10, decimals)
  return Math.round(value * factor) / factor
}
