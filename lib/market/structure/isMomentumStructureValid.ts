// lib/market/structure/isMomentumStructureValid.ts

export type MomentumStructureResult = {
  valid: boolean
  failedReasons: string[]
}

type MomentumStructureInput = {
  rsiSeries: number[]        // RSI 시계열 (0~100)
  momentumSeries: number[]  // 정규화된 모멘텀 또는 가격 변화율
  oiSeries: number[]        // Open Interest
  fundingRate: number       // 현재 펀딩
  closingPressure: number   // -1 ~ +1
}

/**
 * RSI / Momentum Structure Filter
 * ❌ 과매수 / 과매도
 * ❌ 다이버전스
 * ❌ 타이밍
 * ❌ 진입/청산
 * ✅ 구조 설득력 유지 여부만 판단
 */
export function isMomentumStructureValid(
  input: MomentumStructureInput
): MomentumStructureResult {
  const failedReasons: string[] = []

  const {
    rsiSeries,
    momentumSeries,
    oiSeries,
    fundingRate,
    closingPressure
  } = input

  /**
   * 1️⃣ 중립선 위 유지 실패
   * (RSI는 상태 확인용, 신호 아님)
   */
  if (rsiSeries.length >= 3) {
    const recentRSI = rsiSeries.slice(-3)
    const belowNeutral = recentRSI.some(v => v < 50)

    if (belowNeutral) {
      failedReasons.push('RSI_BELOW_NEUTRAL')
    }
  }

  /**
   * 2️⃣ 모멘텀 둔화 발생
   * 연속적인 힘 약화
   */
  if (momentumSeries.length >= 4) {
    const recent = momentumSeries.slice(-4)
    let slowing = false

    for (let i = 2; i < recent.length; i++) {
      if (
        recent[i] < recent[i - 1] &&
        recent[i - 1] < recent[i - 2]
      ) {
        slowing = true
        break
      }
    }

    if (slowing) {
      failedReasons.push('MOMENTUM_SLOWING')
    }
  }

  /**
   * 3️⃣ 모멘텀 과장 (구조 대비 과속)
   */
  if (momentumSeries.length >= 6) {
    const avg =
      momentumSeries.reduce((a, b) => a + b, 0) /
      momentumSeries.length
    const latest = momentumSeries.at(-1)!

    if (latest > avg * 2.2) {
      failedReasons.push('MOMENTUM_EXAGGERATED')
    }
  }

  /**
   * 4️⃣ OI 해소 구간
   * (힘이 유지되는 것처럼 보여도 구조 설득력은 없음)
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
   * 5️⃣ 펀딩 극단
   * (모멘텀이 아니라 포지션 쏠림)
   */
  if (Math.abs(fundingRate) > 0.04) {
    failedReasons.push('FUNDING_EXTREME')
  }

  /**
   * 6️⃣ 종가 압력 유지 실패
   * (끝까지 밀어붙일 힘이 없음)
   */
  if (Math.abs(closingPressure) < 0.25) {
    failedReasons.push('CLOSING_PRESSURE_WEAK')
  }

  return {
    valid: failedReasons.length === 0,
    failedReasons
  }
}
