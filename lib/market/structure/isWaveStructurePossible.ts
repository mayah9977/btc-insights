// lib/market/structure/isWaveStructurePossible.ts

export type WaveStructureResult = {
  possible: boolean
  failedReasons: string[]
}

type Swing = {
  price: number
  type: 'HIGH' | 'LOW'
  index: number
}

type WaveStructureInput = {
  swings: Swing[]             // 고점/저점 구조
  swingIntervals: number[]    // 각 스윙 간 시간 간격
  prices: number[]            // 가격 시계열 (최신이 마지막)
  volumes: number[]           // 거래량 시계열
  oiSeries: number[]          // Open Interest
  closingPressure: number     // -1 ~ +1
}

/**
 * Elliott Wave 구조 해석 가능 여부 판단
 * ❌ 파동 번호
 * ❌ 미래 예측
 * ❌ 방향성
 * ✅ 구조 언어 사용 가능 여부만 판단
 */
export function isWaveStructurePossible(
  input: WaveStructureInput
): WaveStructureResult {
  const failedReasons: string[] = []

  const {
    swings,
    swingIntervals,
    prices,
    volumes,
    oiSeries,
    closingPressure
  } = input

  /**
   * 1️⃣ 구조 연속성 붕괴
   * 스윙 고/저 관계가 계층을 유지하지 못하는 경우
   */
  for (let i = 2; i < swings.length; i++) {
    const prev = swings[i - 1]
    const prevPrev = swings[i - 2]
    const current = swings[i]

    if (
      current.type === prev.type &&
      (
        (current.type === 'HIGH' && current.price <= prevPrev.price) ||
        (current.type === 'LOW' && current.price >= prevPrev.price)
      )
    ) {
      failedReasons.push('STRUCTURAL_CONTINUITY_COLLAPSE')
      break
    }
  }

  /**
   * 2️⃣ 리듬 붕괴 (시간 비대칭 증가)
   */
  if (swingIntervals.length >= 3) {
    const ratios: number[] = []
    for (let i = 1; i < swingIntervals.length; i++) {
      ratios.push(swingIntervals[i] / swingIntervals[i - 1])
    }

    const avgRatio =
      ratios.reduce((a, b) => a + b, 0) / ratios.length

    if (avgRatio > 1.8 || avgRatio < 0.55) {
      failedReasons.push('RHYTHM_DISRUPTION')
    }
  }

  /**
   * 3️⃣ 중첩 구조 발생 (Overlap)
   */
  for (let i = 2; i < swings.length; i++) {
    const a = swings[i - 2]
    const b = swings[i - 1]
    const c = swings[i]

    if (
      c.price > Math.min(a.price, b.price) &&
      c.price < Math.max(a.price, b.price)
    ) {
      failedReasons.push('STRUCTURE_OVERLAP')
      break
    }
  }

  /**
   * 4️⃣ 추진 / 조정 구분 불가
   * 가격 이동 대비 거래량 효율이 너무 낮은 경우
   */
  if (prices.length >= 5 && volumes.length >= 5) {
    const priceMove =
      Math.abs(prices.at(-1)! - prices[prices.length - 5])
    const volumeSum =
      volumes.slice(-5).reduce((a, b) => a + b, 0)

    if (priceMove / volumeSum < 0.00001) {
      failedReasons.push('IMPULSE_CORRECTION_INDISTINGUISHABLE')
    }
  }

  /**
   * 5️⃣ 종가 압력 붕괴
   */
  if (Math.abs(closingPressure) < 0.2) {
    failedReasons.push('CLOSING_PRESSURE_MISMATCH')
  }

  /**
   * 6️⃣ OI 해소 구간
   */
  if (oiSeries.length >= 4) {
    const recentOI = oiSeries.slice(-4)
    const isResolving = recentOI.every(
      (v, i, arr) => i === 0 || v < arr[i - 1]
    )

    if (isResolving) {
      failedReasons.push('OI_RESOLUTION_PHASE')
    }
  }

  /**
   * 7️⃣ 거래량 구조 붕괴
   */
  if (volumes.length >= 6) {
    const avgVolume =
      volumes.reduce((a, b) => a + b, 0) / volumes.length

    const recentVolumes = volumes.slice(-3)
    const collapsed = recentVolumes.every(v => v < avgVolume * 0.6)

    if (collapsed) {
      failedReasons.push('VOLUME_STRUCTURE_COLLAPSE')
    }
  }

  return {
    possible: failedReasons.length === 0,
    failedReasons
  }
}
