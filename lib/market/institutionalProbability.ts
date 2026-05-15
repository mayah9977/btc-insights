/* =========================================================
   📊 Institutional Directional Conviction Engine
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
   🔥 Directional Conviction 계산
========================================================= */

export function calculateInstitutionalProbability({
  institutionalEnergy,
  netRatio,
  oiDelta,
  isSpike,
  fundingBias,
}: {
  institutionalEnergy: number
  netRatio: number
  oiDelta: number
  isSpike: boolean
  fundingBias?: 'LONG_HEAVY' | 'SHORT_HEAVY' | 'NEUTRAL'
}): DirectionalProbabilityResult {

  let longScore = 0
  let shortScore = 0

  /* =======================================================
     1️⃣ Energy Filter
  ======================================================= */

  const energyMagnitude =
    Math.min(45, institutionalEnergy * 45)

  /* =======================================================
     2️⃣ Directional Alignment
  ======================================================= */

  const alignmentStrength =
    Math.min(
      35,
      Math.abs(netRatio) * 320,
    )

  if (netRatio > 0) {
    longScore += alignmentStrength
  }
  else if (netRatio < 0) {
    shortScore += alignmentStrength
  }

  /* =======================================================
     3️⃣ OI Direction Consistency
  ======================================================= */

  let consistencyScore = 0

  if (
    netRatio > 0 &&
    oiDelta > 0
  ) {
    consistencyScore = 15
    longScore += consistencyScore
  }

  else if (
    netRatio < 0 &&
    oiDelta < 0
  ) {
    consistencyScore = 15
    shortScore += consistencyScore
  }

  else {
    consistencyScore = 4

    if (netRatio > 0) {
      longScore += consistencyScore
    }
    else if (netRatio < 0) {
      shortScore += consistencyScore
    }
  }

  /* =======================================================
     4️⃣ Energy Injection
  ======================================================= */

  if (longScore > shortScore) {
    longScore += energyMagnitude
  }
  else if (shortScore > longScore) {
    shortScore += energyMagnitude
  }
  else {
    longScore += energyMagnitude * 0.5
    shortScore += energyMagnitude * 0.5
  }

  /* =======================================================
     5️⃣ Funding Bias
  ======================================================= */

  if (fundingBias === 'LONG_HEAVY') {
    shortScore += 8
  }

  if (fundingBias === 'SHORT_HEAVY') {
    longScore += 8
  }

  /* =======================================================
     6️⃣ Spike Confirmation
  ======================================================= */

  if (isSpike) {
    if (longScore > shortScore) {
      longScore += 5
    }
    else if (shortScore > longScore) {
      shortScore += 5
    }
  }

  /* =======================================================
     7️⃣ Normalize
  ======================================================= */

  const total =
    longScore + shortScore || 1

  const longProbability =
    (longScore / total) * 100

  const shortProbability =
    (shortScore / total) * 100

  /* =======================================================
     8️⃣ Directional Conviction
  ======================================================= */

  const directionalAlignment =
    Math.abs(netRatio)

  const convictionStrength =
    institutionalEnergy *
    directionalAlignment *
    (consistencyScore / 15)

  const confidence =
    Math.pow(
      convictionStrength * 100,
      1.02,
    )

  /* =======================================================
     9️⃣ Dominant
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

function clamp(
  value: number,
  min = 0,
  max = 100,
) {
  return Math.max(
    min,
    Math.min(max, value),
  )
}
