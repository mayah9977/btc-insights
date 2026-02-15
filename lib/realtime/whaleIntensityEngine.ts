// lib/realtime/whaleIntensityEngine.ts
import { saveWhaleIntensity, loadWhaleIntensityHistory } from '@/lib/market/whaleRedisStore'

export type WhaleTrend = 'UP' | 'DOWN' | 'FLAT'

export type WhaleIntensityOutput = {
  value: number        // 0 ~ 1
  avg: number          // 0 ~ 1 (history 기반)
  trend: WhaleTrend
  isSpike: boolean
}

type Input = {
  symbol: string

  oiDelta: number                // absolute OI change
  volumeDelta: number            // last/prev (배수)
  absoluteVolume?: number        // 최근 절대 거래량
  volumeShock?: number           // 순간 충격 (e.g., prev 대비 급증)
  mediumDensityScore?: number    // 중·대형 체결 밀도 (LOW에서만 미세 진동)
}

/**
 * ✅ Whale Intensity SSOT Engine (continuous)
 * - 출력: value/avg/trend/isSpike
 * - LOW 구간에서도 움직임이 보이도록 수학적 감도 설계
 * - history 기반 avg/trend 계산
 */
export async function computeWhaleIntensitySSOT(input: Input): Promise<WhaleIntensityOutput> {
  const {
    symbol,
    oiDelta,
    volumeDelta,
    absoluteVolume = 0,
    volumeShock = 0,
    mediumDensityScore = 0,
  } = input

  // ---------- Guard ----------
  const safeOi = Number.isFinite(oiDelta) ? Math.max(0, oiDelta) : 0
  const safeVolDelta = Number.isFinite(volumeDelta) ? Math.max(0, volumeDelta) : 0
  const safeAbsVol = Number.isFinite(absoluteVolume) ? Math.max(0, absoluteVolume) : 0
  const safeShock = Number.isFinite(volumeShock) ? Math.max(0, volumeShock) : 0
  const safeDensity = Number.isFinite(mediumDensityScore) ? Math.max(0, mediumDensityScore) : 0

  /**
   * =========================
   * 1) Raw score (continuous)
   * =========================
   * - LOW도 “살아있게” 만드는 게 목표
   */

  // OI: 0~(대략 20+)에서 완만 증가
  const oiPart = 1 - Math.exp(-safeOi / 6)               // 0~1

  // VolumeDelta: 1.0이 baseline. 1.0~3.0 구간에서 민감하게
  const vd = Math.max(0, safeVolDelta - 1)               // 0~
  const volPart = 1 - Math.exp(-vd / 0.8)                // 0~1

  // Absolute volume: 0~1M에서 점진 boost
  const absPart = 1 - Math.exp(-safeAbsVol / 600_000)    // 0~1

  // Shock: 0~2 구간에서 빠르게 반응
  const shockPart = 1 - Math.exp(-safeShock / 0.6)       // 0~1

  // Density: LOW에서 “미세 진동” (과도 튐 방지)
  const densityPart = Math.tanh(safeDensity * 0.08)      // 0~1 (완만)

  // 가중 합 (핵심: LOW 살리기 위해 oi/vol에 비중)
  const raw =
    (oiPart * 0.38) +
    (volPart * 0.38) +
    (absPart * 0.12) +
    (shockPart * 0.08) +
    (densityPart * 0.04)

  /**
   * =========================
   * 2) Final value (0~1)
   * =========================
   * exp 압축으로 작은 raw 변화도 “눈에 띄게”
   */
  const k = 2.2
  let value = 1 - Math.exp(-k * raw)

  // clamp
  value = Math.max(0, Math.min(1, value))

  /**
   * =========================
   * 3) History 기반 avg / trend / spike
   * =========================
   */
  const history = await loadWhaleIntensityHistory(symbol)
  const last = history.length ? history[history.length - 1] : undefined

  // avg: SMA(최근 15개) - 단순, 안정적
  const N = 15
  const slice = history.slice(-N)
  const avg = slice.length
    ? slice.reduce((a, b) => a + b, 0) / slice.length
    : value

  // trend: 최근 값 대비 변화율
  let trend: WhaleTrend = 'FLAT'
  if (typeof last === 'number') {
    const diff = value - last
    if (diff > 0.02) trend = 'UP'
    else if (diff < -0.02) trend = 'DOWN'
    else trend = 'FLAT'
  }

  // spike: 평균 대비 급증 + 절대값 조건 (가짜 스파이크 방지)
  const isSpike =
    (avg > 0 && value >= avg * 1.55 && value >= 0.35) ||
    (shockPart >= 0.75 && value >= 0.4)

  // 저장 (history는 그대로)
  await saveWhaleIntensity(symbol, value)

  return {
    value,
    avg,
    trend,
    isSpike,
  }
}
