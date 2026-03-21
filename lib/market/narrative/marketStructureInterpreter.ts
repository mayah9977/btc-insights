import { MarketSnapshot } from '@/lib/market/engine/marketSnapshot'
import { StructureSignal } from '@/lib/market/types/signalTypes'

/* =========================================================
 Threshold Config (🔥 SSE 실데이터 기준으로 완화)
========================================================= */
const OI_THRESHOLD = 0.02
const WHALE_THRESHOLD = 0.002

const VOLUME_SPIKE_THRESHOLD = 1.02
const VOLUME_DROP_THRESHOLD = 0.98

const LIQUIDATION_VOLUME_THRESHOLD = 1.1
const WHALE_AGGRESSIVE_THRESHOLD = 0.01

/* =========================================================
 Interpret Market Structure (Typed)
========================================================= */
export function interpretMarketStructure(
  snapshot: MarketSnapshot
): { structureSignals: StructureSignal[] } {

  const structureSignals: StructureSignal[] = []

  const oiDelta = snapshot.oiDelta ?? 0
  const volumeRatio = snapshot.volumeRatio ?? 1
  const whaleNet = snapshot.whaleNetRatio ?? 0
  const funding = snapshot.fundingBias

  /* =========================================================
   OI Direction
  ========================================================= */
  if (oiDelta > OI_THRESHOLD) {
    structureSignals.push({
      type: 'OI_INCREASE',
      category: 'structure',
      value: oiDelta,
      strength: Math.min(Math.abs(oiDelta), 2),
    })
  }

  if (oiDelta < -OI_THRESHOLD) {
    structureSignals.push({
      type: 'OI_DECREASE',
      category: 'structure',
      value: oiDelta,
      strength: Math.min(Math.abs(oiDelta), 2),
    })
  }

  /* =========================================================
   Volume
  ========================================================= */
  if (volumeRatio > VOLUME_SPIKE_THRESHOLD) {
    structureSignals.push({
      type: 'VOLUME_SPIKE',
      category: 'structure',
      value: volumeRatio,
      strength: volumeRatio,
    })
  }

  if (volumeRatio < VOLUME_DROP_THRESHOLD && volumeRatio > 0) {
    structureSignals.push({
      type: 'VOLUME_DROP',
      category: 'structure',
      value: volumeRatio,
      strength: 1 - volumeRatio,
    })
  }

  /* =========================================================
   Whale Presence
  ========================================================= */
  if (whaleNet > WHALE_THRESHOLD) {
    structureSignals.push({
      type: 'ACCUMULATION',
      category: 'structure',
      value: whaleNet,
      strength: whaleNet,
    })
  }

  if (whaleNet < -WHALE_THRESHOLD) {
    structureSignals.push({
      type: 'DISTRIBUTION',
      category: 'structure',
      value: whaleNet,
      strength: Math.abs(whaleNet),
    })
  }

  /* =========================================================
   Institutional Accumulation
  ========================================================= */
  if (oiDelta > 0 && whaleNet > WHALE_THRESHOLD) {
    structureSignals.push({
      type: 'ACCUMULATION',
      category: 'structure',
      value: whaleNet,
      strength: whaleNet,
    })
  }

  if (oiDelta < 0 && whaleNet < -WHALE_THRESHOLD) {
    structureSignals.push({
      type: 'DISTRIBUTION',
      category: 'structure',
      value: whaleNet,
      strength: Math.abs(whaleNet),
    })
  }

  /* =========================================================
   Funding Bias
  ========================================================= */
  if (funding === 'LONG_HEAVY') {
    structureSignals.push({
      type: 'ACCUMULATION',
      category: 'structure',
      meta: { funding: 'LONG_HEAVY' },
    })
  }

  if (funding === 'SHORT_HEAVY') {
    structureSignals.push({
      type: 'DISTRIBUTION',
      category: 'structure',
      meta: { funding: 'SHORT_HEAVY' },
    })
  }

  /* =========================================================
   Liquidation-like
  ========================================================= */
  if (oiDelta < -OI_THRESHOLD && volumeRatio > LIQUIDATION_VOLUME_THRESHOLD) {
    structureSignals.push({
      type: 'VOLUME_SPIKE',
      category: 'structure',
      value: volumeRatio,
      meta: { liquidationLike: true },
    })
  }

  /* =========================================================
   Whale Aggression
  ========================================================= */
  if (whaleNet < -WHALE_AGGRESSIVE_THRESHOLD && volumeRatio > 1.05) {
    structureSignals.push({
      type: 'DISTRIBUTION',
      category: 'structure',
      value: whaleNet,
      strength: Math.abs(whaleNet),
    })
  }

  if (whaleNet > WHALE_AGGRESSIVE_THRESHOLD && volumeRatio > 1.05) {
    structureSignals.push({
      type: 'ACCUMULATION',
      category: 'structure',
      value: whaleNet,
      strength: whaleNet,
    })
  }

  /* =========================================================
   🔥 Fallback (핵심)
  ========================================================= */
  if (structureSignals.length === 0) {
    if (volumeRatio >= 1) {
      structureSignals.push({
        type: 'VOLUME_SPIKE',
        category: 'structure',
        value: volumeRatio,
        strength: volumeRatio,
      })
    } else {
      structureSignals.push({
  type: volumeRatio >= 1 ? 'VOLUME_SPIKE' : 'VOLUME_DROP',
  category: 'structure',
})
    }
  }

  return {
    structureSignals,
  }
}
