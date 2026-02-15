// lib/market/structure/isStructureOverextended.ts

export type StructureOverextensionResult = {
  overextended: boolean
  failedReasons: string[]
}

type StructureOverextensionInput = {
  high: number          // 최근 구조 고점
  low: number           // 최근 구조 저점
  prevHigh: number      // 이전 구조 고점
  prevLow: number       // 이전 구조 저점

  oiSeries: number[]    // Open Interest 시계열
  volumeSeries: number[]// 거래량 시계열
  fundingRate: number   // 현재 펀딩
  closingPressure: number // -1 ~ +1
}

/**
 * 구조 확장 비율 계산
 * (목표가 개념 ❌, 상대 구조 비교만 사용)
 */
function calcExpansionRatio(
  high: number,
  low: number,
  prevHigh: number,
  prevLow: number
): number {
  const currentRange = Math.abs(high - low)
  const prevRange = Math.abs(prevHigh - prevLow)

  if (prevRange === 0) return 0
  return currentRange / prevRange
}

/**
 * OI 해소 여부
 */
function isOIReducing(oi: number[]): boolean {
  if (oi.length < 4) return false
  const recent = oi.slice(-4)
  return recent.every((v, i, arr) => i === 0 || v < arr[i - 1])
}

/**
 * 거래 효율 저하 (움직임 대비 볼륨 소모)
 */
function isVolumeEfficiencyReduced(volume: number[]): boolean {
  if (volume.length < 6) return false

  const avg =
    volume.reduce((a, b) => a + b, 0) / volume.length
  const recent = volume.slice(-3)

  return recent.every(v => v < avg * 0.75)
}

/**
 * 펀딩 집중
 */
function isFundingConcentrated(funding: number): boolean {
  return Math.abs(funding) > 0.035
}

/**
 * 종가 압력 붕괴
 */
function isClosingPressureCollapsed(cp: number): boolean {
  return Math.abs(cp) < 0.2
}

/**
 * Fibonacci Overextension Filter
 * ❌ 목표가
 * ❌ 되돌림
 * ❌ 방향
 * ✅ 구조 과장 여부만 판단
 */
export function isStructureOverextended(
  input: StructureOverextensionInput
): StructureOverextensionResult {
  const failedReasons: string[] = []

  const {
    high,
    low,
    prevHigh,
    prevLow,
    oiSeries,
    volumeSeries,
    fundingRate,
    closingPressure
  } = input

  /**
   * 1️⃣ 구조 확장 비율
   */
  const expansionRatio = calcExpansionRatio(
    high,
    low,
    prevHigh,
    prevLow
  )

  if (expansionRatio < 2.0) {
    failedReasons.push('EXPANSION_NOT_EXCESSIVE')
  }

  /**
   * 2️⃣ 참여 약화 (OI 감소 OR 거래 효율 저하)
   */
  const participationWeakening =
    isOIReducing(oiSeries) ||
    isVolumeEfficiencyReduced(volumeSeries)

  if (!participationWeakening) {
    failedReasons.push('PARTICIPATION_NOT_WEAKENING')
  }

  /**
   * 3️⃣ 압력 붕괴 (펀딩 집중 OR 종가 압력 붕괴)
   */
  const pressureFailure =
    isFundingConcentrated(fundingRate) ||
    isClosingPressureCollapsed(closingPressure)

  if (!pressureFailure) {
    failedReasons.push('PRESSURE_NOT_FAILED')
  }

  return {
    overextended: failedReasons.length === 0,
    failedReasons
  }
}
