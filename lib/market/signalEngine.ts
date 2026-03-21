/* =========================================================
 Signal Engine (Typed Final - SENSITIVE)
========================================================= */

import { InterpreterEngineResult } from '@/lib/market/engine/interpreterEngine'

/* =========================================================
 Snapshot Type
========================================================= */
type SnapshotLite = {
  priceChangePercent?: number
  oiDelta?: number
  volumeRatio?: number
}

/* =========================================================
 Market Signal Type
========================================================= */
export interface MarketSignal {
  direction: 'long' | 'short' | 'neutral'
  strength: number
  riskLevel: 'low' | 'mid' | 'high'
  dominant: 'liquidation' | 'whale' | 'pressure' | 'structure' | 'none'
  tags: string[]
}

/* =========================================================
 Helpers
========================================================= */
function hasType<T extends { type: string }>(
  arr: T[],
  type: string
) {
  return arr.some(s => s.type === type)
}

/* =========================================================
 Direction Score (🔥 그대로 유지)
========================================================= */
function scoreDirection(input: InterpreterEngineResult): number {
  let score = 0

  if (hasType(input.structureSignals, 'OI_INCREASE')) score += 0.2
  if (hasType(input.structureSignals, 'OI_DECREASE')) score -= 0.2

  if (hasType(input.structureSignals, 'ACCUMULATION')) score += 0.2
  if (hasType(input.structureSignals, 'DISTRIBUTION')) score -= 0.2

  if (hasType(input.pressureSignals, 'LONG_OVERHEAT')) score -= 0.5
  if (hasType(input.pressureSignals, 'SHORT_OVERHEAT')) score += 0.5

  if (hasType(input.whaleSignals, 'WHALE_BUY_CONTROL')) score += 0.3
  if (hasType(input.whaleSignals, 'WHALE_SELL_CONTROL')) score -= 0.3

  if (hasType(input.liquidationSignals, 'LONG_LIQUIDATION')) score -= 0.6
  if (hasType(input.liquidationSignals, 'SHORT_LIQUIDATION')) score += 0.6

  return score
}

/* =========================================================
 FAST
========================================================= */
function detectPriceShock(snapshot?: SnapshotLite) {
  if (!snapshot) return null

  const pct = snapshot.priceChangePercent ?? 0

  if (pct <= -1.2) return { type: 'CRASH', score: -1 }
  if (pct >= 1.2) return { type: 'PUMP', score: +1 }

  return null
}

/* =========================================================
 Fusion
========================================================= */
function detectFusion(input: InterpreterEngineResult) {
  const longLiq = hasType(input.liquidationSignals, 'LONG_LIQUIDATION')
  const shortLiq = hasType(input.liquidationSignals, 'SHORT_LIQUIDATION')

  const whaleBuy = hasType(input.whaleSignals, 'WHALE_BUY_CONTROL')
  const whaleSell = hasType(input.whaleSignals, 'WHALE_SELL_CONTROL')

  if (longLiq && whaleSell) {
    return { type: 'PANIC_DUMP', score: -1.2 }
  }

  if (shortLiq && whaleBuy) {
    return { type: 'SHORT_SQUEEZE', score: +1.2 }
  }

  return null
}

/* =========================================================
 VIP
========================================================= */
function detectVIP(snapshot?: SnapshotLite, input?: InterpreterEngineResult) {
  if (!snapshot || !input) return null

  const oi = snapshot.oiDelta ?? 0
  const vol = snapshot.volumeRatio ?? 1

  if (
    oi < -2 &&
    vol > 1.5 &&
    hasType(input.liquidationSignals, 'LONG_LIQUIDATION')
  ) {
    return { type: 'STRONG_SELL', score: -1 }
  }

  if (
    oi > 2 &&
    vol > 1.5 &&
    hasType(input.liquidationSignals, 'SHORT_LIQUIDATION')
  ) {
    return { type: 'STRONG_BUY', score: +1 }
  }

  return null
}

/* =========================================================
 Risk
========================================================= */
function detectRisk(input: InterpreterEngineResult): MarketSignal['riskLevel'] {
  if (input.liquidationSignals.length > 0) return 'high'
  if (hasType(input.regimeSignals, 'VOLATILE')) return 'mid'
  return 'low'
}

/* =========================================================
 Dominant
========================================================= */
function detectDominant(input: InterpreterEngineResult): MarketSignal['dominant'] {
  if (input.liquidationSignals.length > 0) return 'liquidation'
  if (input.whaleSignals.length > 0) return 'whale'
  if (input.pressureSignals.length > 0) return 'pressure'
  if (input.structureSignals.length > 0) return 'structure'
  return 'none'
}

/* =========================================================
 Tags
========================================================= */
function extractTags(input: InterpreterEngineResult): string[] {
  return [
    ...input.structureSignals.map(s => s.type),
    ...input.pressureSignals.map(s => s.type),
    ...input.whaleSignals.map(s => s.type),
    ...input.liquidationSignals.map(s => s.type),
    ...input.regimeSignals.map(s => s.type),
    ...input.liquidationMapSignals.map(s => s.type),
  ]
}

/* =========================================================
 Build (🔥 민감도 적용)
========================================================= */
export function buildSignal(
  input: InterpreterEngineResult & {
    snapshot?: SnapshotLite
  }
): MarketSignal {

  let score = scoreDirection(input)
  const extraTags: string[] = []

  const shock = detectPriceShock(input.snapshot)
  if (shock) {
    score += shock.score
    extraTags.push(shock.type)
  }

  const fusion = detectFusion(input)
  if (fusion) {
    score += fusion.score
    extraTags.push(fusion.type)
  }

  const vip = detectVIP(input.snapshot, input)
  if (vip) {
    score += vip.score
    extraTags.push(vip.type)
  }

  /* 🔥 핵심: threshold 낮춤 */
  const direction: MarketSignal['direction'] =
    score > 0.3
      ? 'long'
      : score < -0.3
      ? 'short'
      : 'neutral'

  const strength = Math.min(Math.abs(score), 1.5)

  return {
    direction,
    strength,
    riskLevel: detectRisk(input),
    dominant: detectDominant(input),
    tags: [...extractTags(input), ...extraTags],
  }
}
