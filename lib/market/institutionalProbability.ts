/* =========================================================
   📊 Institutional Directional Probability Engine
========================================================= */

export type InstitutionalDirection =
  | 'LONG'
  | 'SHORT'
  | 'NONE'

export interface DirectionalProbabilityResult {
  longProbability: number
  shortProbability: number
  confidence: number
  dominant: InstitutionalDirection
}

/* =========================================================
   🔥 Directional Probability 계산
========================================================= */

export function calculateInstitutionalProbability({
  whaleRatio,
  netRatio,
  oiDelta,
  isSpike,
  fundingBias,
}: {
  whaleRatio: number
  netRatio: number
  oiDelta: number
  isSpike: boolean
  fundingBias?: 'LONG_HEAVY' | 'SHORT_HEAVY' | 'NEUTRAL'
}): DirectionalProbabilityResult {

  let longScore = 0
  let shortScore = 0

  /* =======================================================
     1️⃣ Whale Energy
  ======================================================= */

  const whaleEnergy = Math.min(30, whaleRatio * 40)

  if (netRatio > 0 || oiDelta > 0) {
    longScore += whaleEnergy
  } else if (netRatio < 0 || oiDelta < 0) {
    shortScore += whaleEnergy
  } else {
    longScore += whaleEnergy * 0.5
    shortScore += whaleEnergy * 0.5
  }

  /* =======================================================
     2️⃣ Net Pressure
  ======================================================= */

  if (netRatio > 0) {
    longScore += Math.min(25, netRatio * 80)
  } else if (netRatio < 0) {
    shortScore += Math.min(25, Math.abs(netRatio) * 80)
  }

  /* =======================================================
     3️⃣ OI 방향성
  ======================================================= */

  if (oiDelta > 0) {
    longScore += 15
  } else if (oiDelta < 0) {
    shortScore += 15
  }

  /* =======================================================
     4️⃣ Funding Bias
  ======================================================= */

  if (fundingBias === 'LONG_HEAVY') {
    shortScore += 8
  }

  if (fundingBias === 'SHORT_HEAVY') {
    longScore += 8
  }

  /* =======================================================
     5️⃣ Spike 보정
  ======================================================= */

  if (isSpike) {
    if (longScore > shortScore) {
      longScore += 5
    } else if (shortScore > longScore) {
      shortScore += 5
    }
  }

  /* =======================================================
     6️⃣ Normalize
  ======================================================= */

  const total = longScore + shortScore || 1

  const longProbability =
    (longScore / total) * 100

  const shortProbability =
    (shortScore / total) * 100

  const confidence =
    Math.abs(longProbability - shortProbability)

  /* =======================================================
     7️⃣ Dominant
  ======================================================= */

  let dominant: InstitutionalDirection = 'NONE'

  if (confidence >= 8) {
    dominant =
      longProbability > shortProbability
        ? 'LONG'
        : 'SHORT'
  }

  return {
    longProbability: clamp(longProbability),
    shortProbability: clamp(shortProbability),
    confidence: clamp(confidence),
    dominant,
  }
}

/* =========================================================
   Utility
========================================================= */

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value))
}
