/* =========================================================
   🐋 Whale Intensity v2 Engine
   목적
   - 기관 자금 에너지 감지
   - 0~100 scale 출력
   - 기존 buildRiskInputFromRealtime와 호환
========================================================= */

export interface WhaleIntensityInput {
  oiDeltaRatio: number
  volumeRatio: number
  volatility: number
  drift: number
}

export interface WhaleIntensityResult {
  intensity: number
  level: 'LOW' | 'NORMAL' | 'ELEVATED' | 'EXTREME'
}

/* =========================================================
   🔧 Clamp Utility
========================================================= */

function clamp(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v))
}

/* =========================================================
   🔥 Whale Intensity v2
========================================================= */

export function calculateWhaleIntensityV2(
  input: WhaleIntensityInput,
): WhaleIntensityResult {

  const {
    oiDeltaRatio,
    volumeRatio,
    volatility,
    drift,
  } = input

  /* =========================
     Energy 계산
  ========================= */

  const oiEnergy =
    Math.min(1, Math.abs(oiDeltaRatio) * 22)

  const volumeEnergy =
    Math.min(1, Math.log(volumeRatio + 1) * 2.2)

  const volatilityEnergy =
    Math.min(1, volatility * 1.6)

  const driftEnergy =
    Math.min(1, drift * 0.9)

  /* =========================
     Weighted Intensity
  ========================= */

  const rawIntensity =
      0.40 * oiEnergy +
      0.30 * volumeEnergy +
      0.20 * volatilityEnergy +
      0.10 * driftEnergy

  const intensity = clamp(rawIntensity * 100)

  /* =========================
     Level Classification
  ========================= */

  let level: WhaleIntensityResult['level'] = 'LOW'

  if (intensity >= 80) {
    level = 'EXTREME'
  }
  else if (intensity >= 60) {
    level = 'ELEVATED'
  }
  else if (intensity >= 30) {
    level = 'NORMAL'
  }

  return {
    intensity,
    level,
  }
}
