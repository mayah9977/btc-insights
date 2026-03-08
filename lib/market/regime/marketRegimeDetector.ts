/*
===========================================================
📊 Market Regime Detector
-----------------------------------------------------------
목적
시장 상태 탐지

TREND      : 추세 시장
RANGE      : 횡보 시장
VOLATILE   : 변동성 시장

입력 데이터
- volatility
- oiDeltaRatio
- volumeRatio

출력
- regime
- strength
- confidence
===========================================================
*/

export type MarketRegime =
  | 'TREND'
  | 'RANGE'
  | 'VOLATILE'

export type MarketRegimeResult = {
  regime: MarketRegime
  strength: number
  confidence: number
}

export type MarketRegimeInput = {
  volatility: number
  oiDeltaRatio: number
  volumeRatio: number
}

/*
===========================================================
Threshold
===========================================================
*/

const VOLATILITY_HIGH = 0.015
const VOLATILITY_LOW = 0.005

const OI_TREND_THRESHOLD = 0.002

const VOLUME_EXPANSION = 1.35

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
  volatility: number,
  oiDeltaRatio: number,
  volumeRatio: number,
) {

  const volScore =
    clamp(volatility / VOLATILITY_HIGH)

  const oiScore =
    clamp(Math.abs(oiDeltaRatio) * 150)

  const volumeScore =
    clamp(Math.log(volumeRatio + 1))

  const raw =
      volScore * 0.4 +
      oiScore * 0.35 +
      volumeScore * 0.25

  return clamp(raw)
}

/*
===========================================================
Confidence 계산
===========================================================
*/

function calculateConfidence(
  volatility: number,
  oiDeltaRatio: number,
  volumeRatio: number,
) {

  const volScore =
    clamp(volatility / 0.02)

  const oiScore =
    clamp(Math.abs(oiDeltaRatio) * 120)

  const volumeScore =
    clamp(Math.log(volumeRatio + 1) / 2)

  const raw =
      volScore * 0.35 +
      oiScore * 0.35 +
      volumeScore * 0.30

  return clamp(raw)
}

/*
===========================================================
Market Regime Detector
===========================================================
*/

export function detectMarketRegime(
  input: MarketRegimeInput,
): MarketRegimeResult {

  const {
    volatility,
    oiDeltaRatio,
    volumeRatio,
  } = input

  /*
  ===========================================================
  VOLATILE
  ===========================================================
  */

  if (
    volatility > VOLATILITY_HIGH &&
    volumeRatio > VOLUME_EXPANSION
  ) {

    const strength =
      calculateStrength(
        volatility,
        oiDeltaRatio,
        volumeRatio,
      )

    const confidence =
      calculateConfidence(
        volatility,
        oiDeltaRatio,
        volumeRatio,
      )

    return {
      regime: 'VOLATILE',
      strength,
      confidence,
    }

  }

  /*
  ===========================================================
  TREND
  ===========================================================
  */

  if (
    Math.abs(oiDeltaRatio) > OI_TREND_THRESHOLD &&
    volumeRatio > 1
  ) {

    const strength =
      calculateStrength(
        volatility,
        oiDeltaRatio,
        volumeRatio,
      )

    const confidence =
      calculateConfidence(
        volatility,
        oiDeltaRatio,
        volumeRatio,
      )

    return {
      regime: 'TREND',
      strength,
      confidence,
    }

  }

  /*
  ===========================================================
  RANGE
  ===========================================================
  */

  const strength =
    calculateStrength(
      volatility,
      oiDeltaRatio,
      volumeRatio,
    )

  const confidence =
    calculateConfidence(
      volatility,
      oiDeltaRatio,
      volumeRatio,
    )

  return {
    regime: 'RANGE',
    strength,
    confidence,
  }

}
