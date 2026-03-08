/*
===========================================================
🐋 Whale Absorption Detector
-----------------------------------------------------------
목적
기관 흡수 (Absorption) 탐지

패턴
대량 매도 발생
가격 하락 없음

→ 기관 매집

또는

대량 매수 발생
가격 상승 없음

→ 기관 분배

===========================================================
*/

export type AbsorptionDirection =
  | 'LONG'
  | 'SHORT'
  | 'NONE'

export type WhaleAbsorptionResult = {
  detected: boolean
  direction: AbsorptionDirection
  strength: number
  confidence: number
}

/*
===========================================================
Input
===========================================================
*/

export type WhaleAbsorptionInput = {
  priceChange: number
  whaleBuyVolume: number
  whaleSellVolume: number
  whaleRatio: number
  volumeRatio: number
}

/*
===========================================================
Threshold
===========================================================
*/

const PRICE_TOLERANCE = 0.0007
const WHALE_RATIO_THRESHOLD = 0.28
const VOLUME_RATIO_THRESHOLD = 1.2

/*
===========================================================
Utility
===========================================================
*/

function clamp(v: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v))
}

/*
===========================================================
Strength 계산
===========================================================
*/

function calculateStrength(
  whaleBuyVolume: number,
  whaleSellVolume: number,
  volumeRatio: number,
) {

  const total = whaleBuyVolume + whaleSellVolume

  if (total === 0) return 0

  const dominance =
    Math.abs(whaleBuyVolume - whaleSellVolume) / total

  const volumeBoost =
    Math.min(1, Math.log(volumeRatio + 1))

  const raw =
    dominance * 0.7 +
    volumeBoost * 0.3

  return clamp(raw)
}

/*
===========================================================
Confidence 계산
===========================================================
*/

function calculateConfidence(
  whaleRatio: number,
  volumeRatio: number,
  strength: number,
) {

  const whaleScore =
    clamp(whaleRatio / 0.6)

  const volumeScore =
    clamp(Math.log(volumeRatio + 1) / 2)

  const raw =
      whaleScore * 0.4 +
      volumeScore * 0.3 +
      strength * 0.3

  return clamp(raw)
}

/*
===========================================================
Absorption Detector
===========================================================
*/

export function detectWhaleAbsorption(
  input: WhaleAbsorptionInput,
): WhaleAbsorptionResult {

  const {
    priceChange,
    whaleBuyVolume,
    whaleSellVolume,
    whaleRatio,
    volumeRatio,
  } = input

  /*
  ========================================
  기본 필터
  ========================================
  */

  if (
    whaleRatio < WHALE_RATIO_THRESHOLD ||
    volumeRatio < VOLUME_RATIO_THRESHOLD
  ) {

    return {
      detected: false,
      direction: 'NONE',
      strength: 0,
      confidence: 0,
    }

  }

  /*
  ========================================
  Strength 계산
  ========================================
  */

  const strength = calculateStrength(
    whaleBuyVolume,
    whaleSellVolume,
    volumeRatio,
  )

  /*
  ========================================
  LONG Absorption
  큰 매도
  가격 하락 없음
  ========================================
  */

  if (
    whaleSellVolume > whaleBuyVolume &&
    priceChange > -PRICE_TOLERANCE
  ) {

    const confidence =
      calculateConfidence(
        whaleRatio,
        volumeRatio,
        strength,
      )

    return {
      detected: true,
      direction: 'LONG',
      strength,
      confidence,
    }

  }

  /*
  ========================================
  SHORT Absorption
  큰 매수
  가격 상승 없음
  ========================================
  */

  if (
    whaleBuyVolume > whaleSellVolume &&
    priceChange < PRICE_TOLERANCE
  ) {

    const confidence =
      calculateConfidence(
        whaleRatio,
        volumeRatio,
        strength,
      )

    return {
      detected: true,
      direction: 'SHORT',
      strength,
      confidence,
    }

  }

  /*
  ========================================
  No absorption
  ========================================
  */

  return {
    detected: false,
    direction: 'NONE',
    strength,
    confidence: 0,
  }

}
