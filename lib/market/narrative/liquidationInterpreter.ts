import { MarketSnapshot } from '@/lib/market/engine/marketSnapshot'
import { LiquidationSignal } from '@/lib/market/types/signalTypes'

/* =========================================================
 Threshold Config
========================================================= */
const VOLUME_SPIKE_THRESHOLD = 1.35
const OI_DROP_THRESHOLD = -0.0001

/* =========================================================
 Interpret Liquidation (Typed)
========================================================= */
export function interpretLiquidation(
  snapshot: MarketSnapshot
): { liquidationSignals: LiquidationSignal[] } {

  const liquidationSignals: LiquidationSignal[] = []

  const oiDelta = snapshot.oiDelta ?? 0
  const volumeRatio = snapshot.volumeRatio ?? 1
  const fundingBias = snapshot.fundingBias

  /* =========================================================
   Long Liquidation
  ========================================================= */
  if (
    oiDelta < OI_DROP_THRESHOLD &&
    volumeRatio > VOLUME_SPIKE_THRESHOLD &&
    fundingBias === 'LONG_HEAVY'
  ) {
    liquidationSignals.push({
      type: 'LONG_LIQUIDATION',
      category: 'liquidation',
      value: oiDelta,
      strength: volumeRatio,
    })
  }

  /* =========================================================
   Short Liquidation
  ========================================================= */
  if (
    oiDelta < OI_DROP_THRESHOLD &&
    volumeRatio > VOLUME_SPIKE_THRESHOLD &&
    fundingBias === 'SHORT_HEAVY'
  ) {
    liquidationSignals.push({
      type: 'SHORT_LIQUIDATION',
      category: 'liquidation',
      value: oiDelta,
      strength: volumeRatio,
    })
  }

  /* =========================================================
   Cascade Liquidation
  ========================================================= */
  if (
    oiDelta < OI_DROP_THRESHOLD &&
    volumeRatio > 1.6
  ) {
    liquidationSignals.push({
      type: 'CASCADE_LIQUIDATION',
      category: 'liquidation',
      value: oiDelta,
      strength: volumeRatio,
    })
  }

  /* =========================================================
   Early Liquidation
  ========================================================= */
  if (
    oiDelta < 0 &&
    volumeRatio > 1.2
  ) {
    liquidationSignals.push({
      type: 'EARLY_LIQUIDATION',
      category: 'liquidation',
      value: oiDelta,
      strength: volumeRatio,
    })
  }

  return {
    liquidationSignals,
  }
}
