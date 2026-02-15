import { observe } from '@/lib/log/observe'

export type WhaleIntensity = 'LOW' | 'MEDIUM' | 'HIGH'

type Input = {
  oiDelta: number
  volumeDelta: number

  absoluteVolume?: number
  volumeShock?: number

  mediumDensityScore?: number
}

/**
 * Whale Intensity (Live-Responsive Version)
 *
 * ✅ EXTREME 없음 (RiskEngine 전용)
 * ✅ HIGH / MEDIUM 실전 반응 기준 완화
 * ✅ LOW 구간 미세 압력 반영
 * ✅ LIVE 환경에서 실제 움직이도록 재설계
 */
export function calcWhaleIntensity({
  oiDelta,
  volumeDelta,
  absoluteVolume = 0,
  volumeShock = 0,
  mediumDensityScore = 0,
}: Input): WhaleIntensity {

  /* =========================
   * 1️⃣ Absolute Volume Pressure (완화)
   * ========================= */
  const volumePressure =
    absoluteVolume >= 400_000 ||   // 더 현실적
    volumeShock >= 1.2             // 완화

  /* =========================
   * 2️⃣ 실시간 보정치 (LIVE 반응용)
   * ========================= */
  const boost =
    (volumePressure ? 0.4 : 0) +
    Math.min(volumeShock * 0.25, 0.8) +
    Math.min(absoluteVolume / 3_000_000, 0.6)

  const effectiveOi = oiDelta + boost
  const effectiveVolume = volumeDelta + boost * 0.4

  /* =========================
   * 3️⃣ HIGH (LIVE 현실 기준)
   * ========================= */
  if (
    effectiveOi >= 2 &&          // 🔥 6 → 2
    effectiveVolume >= 1.4       // 🔥 1.8 → 1.4
  ) {
    return 'HIGH'
  }

  /* =========================
   * 4️⃣ MEDIUM (LIVE 현실 기준)
   * ========================= */
  if (
    effectiveOi >= 0.8 &&        // 🔥 2 → 0.8
    effectiveVolume >= 1.1       // 🔥 1.15 → 1.1
  ) {
    return 'MEDIUM'
  }

  /* =========================
   * 5️⃣ LOW 구간 압력 감지 (부드럽게)
   * ========================= */
  const auxiliaryPressure =
    Math.tanh(mediumDensityScore * 0.1) * 0.1

  if (
    process.env.NODE_ENV !== 'production' &&
    mediumDensityScore > 0 &&
    auxiliaryPressure > 0.01
  ) {
    observe('WhalePressureLive', {
      mediumDensityScore,
      auxiliaryPressure,
    })
  }

  return 'LOW'
}
