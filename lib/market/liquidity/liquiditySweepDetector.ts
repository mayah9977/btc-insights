/*
===========================================================
💧 Liquidity Sweep Detector
-----------------------------------------------------------
목적
기관 Stop Hunt / Liquidity Sweep 탐지

패턴
가격 급등 후 즉시 되돌림
가격 급락 후 즉시 되돌림

→ 스탑 헌트 가능성

출력
SWEEP_UP
SWEEP_DOWN
NONE
===========================================================
*/

export type LiquiditySweepDirection =
  | 'SWEEP_UP'
  | 'SWEEP_DOWN'
  | 'NONE'

export type LiquiditySweepResult = {
  detected: boolean
  direction: LiquiditySweepDirection
  strength: number
  confidence: number
}

export type LiquiditySweepInput = {
  recentPrices: number[]
  volumeRatio: number
  volatility: number
}

/*
===========================================================
Threshold
===========================================================
*/

const MIN_PRICE_POINTS = 12
const SWEEP_MOVE_THRESHOLD = 0.003
const VOLUME_SPIKE_THRESHOLD = 1.35
const VOLATILITY_THRESHOLD = 0.004

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
  move: number,
  volumeRatio: number,
  volatility: number,
) {

  const moveScore =
    clamp(move / 0.01)

  const volumeScore =
    clamp(Math.log(volumeRatio + 1))

  const volScore =
    clamp(volatility / 0.02)

  const raw =
      moveScore * 0.5 +
      volumeScore * 0.3 +
      volScore * 0.2

  return clamp(raw)
}

/*
===========================================================
Confidence 계산
===========================================================
*/

function calculateConfidence(
  move: number,
  volumeRatio: number,
  volatility: number,
) {

  const moveScore =
    clamp(move / 0.008)

  const volumeScore =
    clamp(Math.log(volumeRatio + 1) / 2)

  const volScore =
    clamp(volatility / 0.02)

  const raw =
      moveScore * 0.4 +
      volumeScore * 0.35 +
      volScore * 0.25

  return clamp(raw)
}

/*
===========================================================
Sweep Move 계산
===========================================================
*/

function calculateMove(
  prices: number[],
) {

  const high = Math.max(...prices)
  const low = Math.min(...prices)

  const last = prices[prices.length - 1]

  const upMove =
    (high - last) / last

  const downMove =
    (last - low) / last

  return {
    upMove,
    downMove,
  }
}

/*
===========================================================
Liquidity Sweep Detector
===========================================================
*/

export function detectLiquiditySweep(
  input: LiquiditySweepInput,
): LiquiditySweepResult {

  const {
    recentPrices,
    volumeRatio,
    volatility,
  } = input

  /*
  ========================================
  데이터 부족
  ========================================
  */

  if (
    !recentPrices ||
    recentPrices.length < MIN_PRICE_POINTS
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
  Volume 필터
  ========================================
  */

  if (
    volumeRatio < VOLUME_SPIKE_THRESHOLD ||
    volatility < VOLATILITY_THRESHOLD
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
  Sweep Move 계산
  ========================================
  */

  const { upMove, downMove } =
    calculateMove(recentPrices)

  /*
  ========================================
  Sweep Up
  가격 급등 후 되돌림
  ========================================
  */

  if (upMove > SWEEP_MOVE_THRESHOLD) {

    const strength =
      calculateStrength(
        upMove,
        volumeRatio,
        volatility,
      )

    const confidence =
      calculateConfidence(
        upMove,
        volumeRatio,
        volatility,
      )

    return {
      detected: true,
      direction: 'SWEEP_UP',
      strength,
      confidence,
    }

  }

  /*
  ========================================
  Sweep Down
  가격 급락 후 되돌림
  ========================================
  */

  if (downMove > SWEEP_MOVE_THRESHOLD) {

    const strength =
      calculateStrength(
        downMove,
        volumeRatio,
        volatility,
      )

    const confidence =
      calculateConfidence(
        downMove,
        volumeRatio,
        volatility,
      )

    return {
      detected: true,
      direction: 'SWEEP_DOWN',
      strength,
      confidence,
    }

  }

  /*
  ========================================
  No Sweep
  ========================================
  */

  return {
    detected: false,
    direction: 'NONE',
    strength: 0,
    confidence: 0,
  }

}
