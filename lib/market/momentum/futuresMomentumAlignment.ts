export type FMAIDirection =
  | 'STRONG_LONG'
  | 'STRONG_SHORT'
  | 'SHORT_SQUEEZE'
  | 'LONG_LIQUIDATION'
  | 'NEUTRAL'

export interface FMAIResult {
  score: number
  direction: FMAIDirection
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

export function calculateFMAI(params: {
  priceChange: number
  oiDeltaRatio: number
  volumeRatio: number
}): FMAIResult {

  const priceMomentum = params.priceChange * 4
  const oiMomentum = params.oiDeltaRatio * 8
  const volumeMomentum = Math.log(params.volumeRatio + 1)

  const rawScore =
    0.5 * priceMomentum +
    0.3 * oiMomentum +
    0.2 * volumeMomentum

  const score = clamp(rawScore, -1, 1)

  let direction: FMAIDirection = 'NEUTRAL'

  if (score > 0.35) direction = 'STRONG_LONG'
  else if (score < -0.35) direction = 'STRONG_SHORT'
  else if (score > 0.15 && params.oiDeltaRatio < 0)
    direction = 'SHORT_SQUEEZE'
  else if (score < -0.15 && params.oiDeltaRatio > 0)
    direction = 'LONG_LIQUIDATION'

  return { score, direction }
}
