import { MarketSnapshot } from '@/lib/market/engine/marketSnapshot'
import { WhaleSignal } from '@/lib/market/types/signalTypes'

/* =========================================================
 Threshold Config (🔥 실데이터 기준 완화)
========================================================= */
const WHALE_BASE_THRESHOLD = 0.002
const WHALE_DOMINANT_THRESHOLD = 0.01

const VOLUME_CONFIRM_THRESHOLD = 1.02

/* =========================================================
 Interpret Whale Control (Typed)
========================================================= */
export function interpretWhaleControl(
  snapshot: MarketSnapshot
): { whaleSignals: WhaleSignal[] } {

  const whaleSignals: WhaleSignal[] = []

  const whaleNet = snapshot.whaleNetRatio ?? 0
  const volumeRatio = snapshot.volumeRatio ?? 1
  const oiDelta = snapshot.oiDelta ?? 0

  /* =========================================================
   Whale Base Detection
  ========================================================= */
  if (whaleNet > WHALE_BASE_THRESHOLD) {
    whaleSignals.push({
      type: 'WHALE_BUY_CONTROL',
      category: 'whale',
      value: whaleNet,
      strength: whaleNet,
    })
  }

  if (whaleNet < -WHALE_BASE_THRESHOLD) {
    whaleSignals.push({
      type: 'WHALE_SELL_CONTROL',
      category: 'whale',
      value: whaleNet,
      strength: Math.abs(whaleNet),
    })
  }

  /* =========================================================
   Whale Dominance
  ========================================================= */
  if (
    whaleNet > WHALE_DOMINANT_THRESHOLD &&
    volumeRatio > VOLUME_CONFIRM_THRESHOLD
  ) {
    whaleSignals.push({
      type: 'WHALE_BUY_CONTROL',
      category: 'whale',
      value: whaleNet,
      strength: volumeRatio,
    })
  }

  if (
    whaleNet < -WHALE_DOMINANT_THRESHOLD &&
    volumeRatio > VOLUME_CONFIRM_THRESHOLD
  ) {
    whaleSignals.push({
      type: 'WHALE_SELL_CONTROL',
      category: 'whale',
      value: whaleNet,
      strength: volumeRatio,
    })
  }

  /* =========================================================
   Whale Accumulation
  ========================================================= */
  if (whaleNet > WHALE_BASE_THRESHOLD && oiDelta > 0) {
    whaleSignals.push({
      type: 'WHALE_ACCUMULATION',
      category: 'whale',
      value: whaleNet,
      strength: whaleNet,
    })
  }

  /* =========================================================
   Whale Distribution
  ========================================================= */
  if (whaleNet < -WHALE_BASE_THRESHOLD && oiDelta < 0) {
    whaleSignals.push({
      type: 'WHALE_DISTRIBUTION',
      category: 'whale',
      value: whaleNet,
      strength: Math.abs(whaleNet),
    })
  }

  /* =========================================================
   Whale Influence
  ========================================================= */
  if (
    Math.abs(whaleNet) > WHALE_DOMINANT_THRESHOLD &&
    volumeRatio < 1
  ) {
    whaleSignals.push({
      type: 'WHALE_INFLUENCE',
      category: 'whale',
      value: whaleNet,
      strength: Math.abs(whaleNet),
    })
  }

  /* =========================================================
   🔥 Fallback (핵심)
  ========================================================= */
  if (whaleSignals.length === 0 && Math.abs(whaleNet) > 0) {
    whaleSignals.push({
      type: whaleNet > 0 ? 'WHALE_BUY_CONTROL' : 'WHALE_SELL_CONTROL',
      category: 'whale',
      value: whaleNet,
      strength: Math.abs(whaleNet),
    })
  }

  return {
    whaleSignals,
  }
}
