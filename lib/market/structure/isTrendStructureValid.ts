// lib/market/structure/isTrendStructureValid.ts

export type TrendStructureResult = {
  valid: boolean
  failedReasons: string[]
}

type Swing = {
  price: number
  type: 'HIGH' | 'LOW'
  index: number
}

type TrendStructureInput = {
  swings: Swing[]              // 고점/저점 구조
  slopeSeries: number[]        // 추세 기울기 히스토리
  retracementRatios: number[]  // 되돌림 비율 (0~1)
  closingPressure: number      // -1 ~ +1
  oiSeries: number[]           // Open Interest
  volumeSeries: number[]       // 거래량
  fundingRate: number          // 현재 펀딩
}

/**
 * Trend Structure Stability Filter
 * ❌ 진입/청산
 * ❌ 방향
 * ❌ 목표
 * ❌ 돌파/이탈
 * ✅ 추세 언어 사용 가능 여부만 판단
 */
export function isTrendStructureValid(
  input: TrendStructureInput
): TrendStructureResult {
  const failedReasons: string[] = []

  const {
    swings,
    slopeSeries,
    retracementRatios,
    closingPressure,
    oiSeries,
    volumeSeries,
    fundingRate
  } = input

  /**
   * 1️⃣ 스윙 고/저 관계 연속성 붕괴
   */
  for (let i = 2; i < swings.length; i++) {
    const prevPrev = swings[i - 2]
    const prev = swings[i - 1]
    const current = swings[i]

    if (
      current.type === prev.type &&
      (
        (current.type === 'HIGH' && current.price <= prevPrev.price) ||
        (current.type === 'LOW' && current.price >= prevPrev.price)
      )
    ) {
      failedReasons.push('SWING_RELATIONSHIP_BROKEN')
      break
    }
  }

  /**
   * 2️⃣ 종가 압력 일관성 붕괴
   */
  if (Math.abs(closingPressure) < 0.25) {
    failedReasons.push('CLOSING_PRESSURE_UNSTABLE')
  }

  /**
   * 3️⃣ 기울기 변화 (같은 추세로 보기 어려움)
   */
  if (slopeSeries.length >= 3) {
    const recent = slopeSeries.slice(-3)
    const avg =
      recent.reduce((a, b) => a + b, 0) / recent.length

    const slopeShift = recent.some(
      s => Math.abs(s - avg) / Math.abs(avg) > 0.2
    )

    if (slopeShift) {
      failedReasons.push('SLOPE_SHIFT_DETECTED')
    }
  }

  /**
   * 4️⃣ 되돌림 깊이 허용 범위 이탈
   */
  if (retracementRatios.length > 0) {
    const recent = retracementRatios.slice(-3)
    const outOfRange = recent.some(
      r => r < 0.25 || r > 0.75
    )

    if (outOfRange) {
      failedReasons.push('RETRACEMENT_OUT_OF_RANGE')
    }
  }

  /**
   * 5️⃣ OI 해소 구간
   */
  if (oiSeries.length >= 4) {
    const recentOI = oiSeries.slice(-4)
    const resolving = recentOI.every(
      (v, i, arr) => i === 0 || v < arr[i - 1]
    )

    if (resolving) {
      failedReasons.push('OI_RESOLUTION_PHASE')
    }
  }

  /**
   * 6️⃣ 거래량 유지 실패
   */
  if (volumeSeries.length >= 6) {
    const avgVolume =
      volumeSeries.reduce((a, b) => a + b, 0) / volumeSeries.length

    const recentVolumes = volumeSeries.slice(-3)
    const volumeDrop = recentVolumes.some(
      v => v < avgVolume * 0.7
    )

    if (volumeDrop) {
      failedReasons.push('VOLUME_NOT_MAINTAINED')
    }
  }

  /**
   * 7️⃣ 펀딩 극단 (포지션 과밀)
   */
  if (Math.abs(fundingRate) > 0.04) {
    failedReasons.push('FUNDING_EXTREME')
  }

  return {
    valid: failedReasons.length === 0,
    failedReasons
  }
}
