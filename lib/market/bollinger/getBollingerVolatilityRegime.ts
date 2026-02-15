// lib/market/bollinger/getBollingerVolatilityRegime.ts

export type VolatilityRegime =
  | 'EXPANDED'     // 이미 크게 움직인 상태
  | 'COMPRESSING' // 수축 + 가격 밀집 (압력 누적 경고)
  | 'NEUTRAL'     // 의미 없는 변동성

type BollingerInput = {
  prices: number[]        // 종가 배열 (최신이 마지막)
  period?: number         // 기본 20
  stdMultiplier?: number // 기본 2
  lookback?: number       // 변동성 비교용 N bar (기본 20)
}

type BollingerBands = {
  middle: number
  upper: number
  lower: number
  width: number
}

/**
 * 단순 이동평균
 */
function sma(values: number[]): number {
  const sum = values.reduce((a, b) => a + b, 0)
  return sum / values.length
}

/**
 * 표준편차
 */
function std(values: number[], mean: number): number {
  const variance =
    values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) /
    values.length
  return Math.sqrt(variance)
}

/**
 * Bollinger Bands 계산
 */
function calculateBollingerBands(
  prices: number[],
  period: number,
  stdMultiplier: number
): BollingerBands {
  const slice = prices.slice(-period)
  const middle = sma(slice)
  const deviation = std(slice, middle)

  const upper = middle + stdMultiplier * deviation
  const lower = middle - stdMultiplier * deviation
  const width = (upper - lower) / middle

  return { middle, upper, lower, width }
}

/**
 * Bollinger Volatility Regime Detector
 * ❌ 매수/매도
 * ❌ 돌파/이탈
 * ❌ 타이밍
 * ✅ 오직 변동성 상태만 판단
 */
export function getBollingerVolatilityRegime(
  input: BollingerInput
): VolatilityRegime {
  const {
    prices,
    period = 20,
    stdMultiplier = 2,
    lookback = 20
  } = input

  if (prices.length < period + lookback) {
    return 'NEUTRAL'
  }

  // 현재 Bollinger
  const current = calculateBollingerBands(
    prices,
    period,
    stdMultiplier
  )

  // 과거 평균 Band Width
  const historicalWidths: number[] = []

  for (let i = lookback; i > 0; i--) {
    const pastPrices = prices.slice(0, prices.length - i)
    if (pastPrices.length >= period) {
      const band = calculateBollingerBands(
        pastPrices,
        period,
        stdMultiplier
      )
      historicalWidths.push(band.width)
    }
  }

  const avgHistoricalWidth =
    historicalWidths.reduce((a, b) => a + b, 0) /
    historicalWidths.length

  const widthChangeRate =
    (current.width - historicalWidths.at(-1)!) /
    historicalWidths.at(-1)!

  const relativeWidth = current.width / avgHistoricalWidth

  // 가격 밀집 여부 (상·하단 의미 없음)
  const latestPrice = prices.at(-1)!
  const isPriceCrowded =
    latestPrice > current.lower + (current.upper - current.lower) * 0.25 &&
    latestPrice < current.lower + (current.upper - current.lower) * 0.75

  /**
   * 상태 판단
   */

  // 1️⃣ 이미 크게 확장된 상태 (움직임 완료)
  if (
    widthChangeRate > 0.25 &&
    relativeWidth > 1.5
  ) {
    return 'EXPANDED'
  }

  // 2️⃣ 수축 + 밀집 (압력 누적 경고)
  if (
    widthChangeRate < -0.15 &&
    relativeWidth < 0.8 &&
    isPriceCrowded
  ) {
    return 'COMPRESSING'
  }

  // 3️⃣ 의미 없는 변동성
  return 'NEUTRAL'
}
