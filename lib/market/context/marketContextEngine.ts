/* =========================================================
Market Context Engine

Role
Raw Market Data
↓
Market Context

OI
Funding
Volume
Whale
Volatility

→ Unified Market Context

This layer normalizes raw market data so that
all interpreters use the same market state.
========================================================= */

import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

/* =========================================================
Context Types
========================================================= */

export type OITrend =
  | 'INCREASING'
  | 'DECREASING'
  | 'STABLE'

export type FundingState =
  | 'LONG_HEAVY'
  | 'SHORT_HEAVY'
  | 'NEUTRAL'

export type VolumeState =
  | 'SURGE'
  | 'NORMAL'
  | 'DROP'

export type WhaleState =
  | 'BUY_DOMINANT'
  | 'SELL_DOMINANT'
  | 'NEUTRAL'

export type VolatilityState =
  | 'HIGH'
  | 'NORMAL'
  | 'LOW'

/* =========================================================
Market Context Structure
========================================================= */

export interface MarketContext {

  oiTrend: OITrend

  fundingState: FundingState

  volumeState: VolumeState

  whaleState: WhaleState

  volatilityState: VolatilityState

}

/* =========================================================
Threshold Config
========================================================= */

const OI_FLAT_THRESHOLD = 0.0003

const VOLUME_SURGE_THRESHOLD = 1.3
const VOLUME_DROP_THRESHOLD = 0.8

const VOLATILITY_HIGH_THRESHOLD = 1.5
const VOLATILITY_LOW_THRESHOLD = 0.7

const WHALE_DOMINANCE_THRESHOLD = 0.05

/* =========================================================
OI Trend
========================================================= */

function interpretOITrend(oiDelta: number): OITrend {

  if (oiDelta > OI_FLAT_THRESHOLD) {
    return 'INCREASING'
  }

  if (oiDelta < -OI_FLAT_THRESHOLD) {
    return 'DECREASING'
  }

  return 'STABLE'
}

/* =========================================================
Funding State
========================================================= */

function interpretFundingState(
  fundingBias?: 'LONG_HEAVY' | 'SHORT_HEAVY' | 'NEUTRAL'
): FundingState {

  if (fundingBias === 'LONG_HEAVY') {
    return 'LONG_HEAVY'
  }

  if (fundingBias === 'SHORT_HEAVY') {
    return 'SHORT_HEAVY'
  }

  return 'NEUTRAL'
}

/* =========================================================
Volume State
========================================================= */

function interpretVolumeState(volumeRatio: number): VolumeState {

  if (volumeRatio > VOLUME_SURGE_THRESHOLD) {
    return 'SURGE'
  }

  if (volumeRatio < VOLUME_DROP_THRESHOLD) {
    return 'DROP'
  }

  return 'NORMAL'
}

/* =========================================================
Whale State
========================================================= */

function interpretWhaleState(
  whaleNetRatio: number
): WhaleState {

  if (whaleNetRatio > WHALE_DOMINANCE_THRESHOLD) {
    return 'BUY_DOMINANT'
  }

  if (whaleNetRatio < -WHALE_DOMINANCE_THRESHOLD) {
    return 'SELL_DOMINANT'
  }

  return 'NEUTRAL'
}

/* =========================================================
Volatility State
========================================================= */

function interpretVolatilityState(
  volumeRatio: number
): VolatilityState {

  if (volumeRatio > VOLATILITY_HIGH_THRESHOLD) {
    return 'HIGH'
  }

  if (volumeRatio < VOLATILITY_LOW_THRESHOLD) {
    return 'LOW'
  }

  return 'NORMAL'
}

/* =========================================================
Create Market Context
========================================================= */

export function createMarketContext(): MarketContext {

  const market = useVIPMarketStore.getState()

  const oiDelta = market.oiDelta ?? 0
  const volumeRatio = market.volumeRatio ?? 1
  const whaleNetRatio = market.whaleNetRatio ?? 0
  const fundingBias = market.fundingBias

  const context: MarketContext = {

    oiTrend: interpretOITrend(oiDelta),

    fundingState: interpretFundingState(fundingBias),

    volumeState: interpretVolumeState(volumeRatio),

    whaleState: interpretWhaleState(whaleNetRatio),

    volatilityState: interpretVolatilityState(volumeRatio),

  }

  return context
}
