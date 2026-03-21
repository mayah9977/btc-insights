import { MarketSnapshot } from '@/lib/market/engine/marketSnapshot'
import { LiquidationMapSignal } from '@/lib/market/types/signalTypes'

/* =========================================================
 Threshold Config
========================================================= */
const VOLUME_LIQUIDATION_THRESHOLD = 1.35
const WHALE_STRONG_THRESHOLD = 0.1
const OI_DROP_THRESHOLD = -0.001
const OI_RISE_THRESHOLD = 0.001

/* =========================================================
 Interpret Liquidation Map (Typed)
========================================================= */
export function interpretLiquidationMap(
  snapshot: MarketSnapshot
): { liquidationMapSignals: LiquidationMapSignal[] } {

  const {
    oiDelta = 0,
    volumeRatio = 1,
    fundingBias,
    whaleNetRatio = 0,
  } = snapshot

  const liquidationMapSignals: LiquidationMapSignal[] = []

  /* =========================================================
   LONG Liquidation Zone
  ========================================================= */
  if (
    oiDelta < OI_DROP_THRESHOLD &&
    volumeRatio > VOLUME_LIQUIDATION_THRESHOLD &&
    fundingBias === 'LONG_HEAVY'
  ) {
    liquidationMapSignals.push({
      type: 'LONG_LIQUIDATION_ZONE',
      category: 'liquidation_map',
      value: oiDelta,
      strength: volumeRatio,
    })
  }

  /* =========================================================
   SHORT Liquidation Zone
  ========================================================= */
  if (
    oiDelta < OI_DROP_THRESHOLD &&
    volumeRatio > VOLUME_LIQUIDATION_THRESHOLD &&
    fundingBias === 'SHORT_HEAVY'
  ) {
    liquidationMapSignals.push({
      type: 'SHORT_LIQUIDATION_ZONE',
      category: 'liquidation_map',
      value: oiDelta,
      strength: volumeRatio,
    })
  }

  /* =========================================================
   SHORT Squeeze Risk
  ========================================================= */
  if (
    oiDelta > OI_RISE_THRESHOLD &&
    whaleNetRatio > WHALE_STRONG_THRESHOLD
  ) {
    liquidationMapSignals.push({
      type: 'SHORT_SQUEEZE_RISK',
      category: 'liquidation_map',
      value: whaleNetRatio,
      strength: whaleNetRatio,
    })
  }

  /* =========================================================
   LONG Squeeze Risk
  ========================================================= */
  if (
    oiDelta > OI_RISE_THRESHOLD &&
    whaleNetRatio < -WHALE_STRONG_THRESHOLD
  ) {
    liquidationMapSignals.push({
      type: 'LONG_SQUEEZE_RISK',
      category: 'liquidation_map',
      value: whaleNetRatio,
      strength: Math.abs(whaleNetRatio),
    })
  }

  /* =========================================================
   High Volatility Liquidation Cluster
  ========================================================= */
  if (
    volumeRatio > 1.6 &&
    Math.abs(oiDelta) > 0.001
  ) {
    liquidationMapSignals.push({
      type: 'LIQUIDATION_CLUSTER',
      category: 'liquidation_map',
      value: volumeRatio,
      strength: volumeRatio,
    })
  }

  return {
    liquidationMapSignals,
  }
}
