/* =========================================================
  Position Pressure Interpreter (FINAL - FIXED FOR REAL DATA)
========================================================= */

import { MarketSnapshot } from '@/lib/market/engine/marketSnapshot'
import { PressureSignal } from '@/lib/market/types/signalTypes'

/* =========================================================
  🔥 Whale Pressure Type
========================================================= */
export type WhalePressure =
  | 'NORMAL'
  | 'ELEVATED'
  | 'EXTREME'

/* =========================================================
  🔥 Threshold Config (실데이터 기준 완화)
========================================================= */
const OI_INCREASE_THRESHOLD = 0
const OI_DECREASE_THRESHOLD = 0

const VOLUME_SURGE_THRESHOLD = 1.1

const WHALE_STRONG_BUY = 0.02
const WHALE_STRONG_SELL = -0.02

const WHALE_ELEVATED = 0.01
const WHALE_EXTREME = 0.05

/* 🔥 Overheat 기준 */
const OI_STRONG_INCREASE = 0.2

/* =========================================================
  🔥 Whale Pressure 계산
========================================================= */
export function deriveWhalePressure(
  snapshot: MarketSnapshot,
): WhalePressure {
  const ratio = snapshot.whaleNetRatio ?? 0
  const abs = Math.abs(ratio)

  if (abs >= WHALE_EXTREME) return 'EXTREME'
  if (abs >= WHALE_ELEVATED) return 'ELEVATED'
  return 'NORMAL'
}

/* =========================================================
  Interpret Position Pressure
========================================================= */
export function interpretPositionPressure(
  snapshot: MarketSnapshot,
): { pressureSignals: PressureSignal[] } {

  const pressureSignals: PressureSignal[] = []

  const {
    oiDelta = 0,
    volumeRatio = 1,
    fundingBias,
    whaleNetRatio = 0,
  } = snapshot

  /* =========================================================
    LONG Liquidation Pressure
  ========================================================= */
  if (
    oiDelta < OI_DECREASE_THRESHOLD &&
    volumeRatio > VOLUME_SURGE_THRESHOLD &&
    fundingBias === 'LONG_HEAVY'
  ) {
    pressureSignals.push({
      type: 'LONG_LIQUIDATION_PRESSURE',
      category: 'pressure',
      value: oiDelta,
      strength: volumeRatio,
    })
  }

  /* =========================================================
    SHORT Liquidation Pressure
  ========================================================= */
  if (
    oiDelta < OI_DECREASE_THRESHOLD &&
    volumeRatio > VOLUME_SURGE_THRESHOLD &&
    fundingBias === 'SHORT_HEAVY'
  ) {
    pressureSignals.push({
      type: 'SHORT_LIQUIDATION_PRESSURE',
      category: 'pressure',
      value: oiDelta,
      strength: volumeRatio,
    })
  }

  /* =========================================================
    LONG Build-up
  ========================================================= */
  if (
    oiDelta > OI_INCREASE_THRESHOLD &&
    fundingBias === 'LONG_HEAVY'
  ) {
    pressureSignals.push({
      type: 'LONG_BUILDUP',
      category: 'pressure',
      value: oiDelta,
      strength: Math.min(oiDelta, 2),
    })
  }

  /* =========================================================
    SHORT Build-up
  ========================================================= */
  if (
    oiDelta > OI_INCREASE_THRESHOLD &&
    fundingBias === 'SHORT_HEAVY'
  ) {
    pressureSignals.push({
      type: 'SHORT_BUILDUP',
      category: 'pressure',
      value: oiDelta,
      strength: Math.min(oiDelta, 2),
    })
  }

  /* =========================================================
    LONG OVERHEAT
  ========================================================= */
  if (
    oiDelta > OI_STRONG_INCREASE &&
    fundingBias === 'LONG_HEAVY' &&
    volumeRatio > 1.15
  ) {
    pressureSignals.push({
      type: 'LONG_OVERHEAT',
      category: 'pressure',
      value: oiDelta,
      strength: volumeRatio,
    })
  }

  /* =========================================================
    SHORT OVERHEAT
  ========================================================= */
  if (
    oiDelta > OI_STRONG_INCREASE &&
    fundingBias === 'SHORT_HEAVY' &&
    volumeRatio > 1.15
  ) {
    pressureSignals.push({
      type: 'SHORT_OVERHEAT',
      category: 'pressure',
      value: oiDelta,
      strength: volumeRatio,
    })
  }

  /* =========================================================
    Squeeze Risk (완화)
  ========================================================= */
  if (
    oiDelta > 0 &&
    Math.abs(whaleNetRatio) > WHALE_STRONG_BUY
  ) {
    pressureSignals.push({
      type: 'SQUEEZE_RISK',
      category: 'pressure',
      value: whaleNetRatio,
      strength: Math.abs(whaleNetRatio),
    })
  }

  /* =========================================================
   🔥 Fallback (핵심 추가)
  ========================================================= */
  if (pressureSignals.length === 0 && oiDelta !== 0) {
    pressureSignals.push({
      type: oiDelta > 0 ? 'LONG_BUILDUP' : 'SHORT_BUILDUP',
      category: 'pressure',
      value: oiDelta,
      strength: Math.abs(oiDelta),
    })
  }

  return {
    pressureSignals,
  }
}
