/* =========================================================
 Market Snapshot Engine (FINAL - NO FALLBACK + CACHE FIX)
========================================================= */

import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'
import {
  FundingBias,
  ActionGateState,
} from '@/lib/market/store/vipMarketStore'

export interface MarketSnapshot {
  oi: number
  oiDelta: number

  volume: number
  volumeRatio: number

  fundingRate: number
  fundingBias: FundingBias

  price: number
  priceChangePercent: number

  whaleIntensity: number
  whaleRatio: number
  whaleNet: number
  whaleNetRatio: number

  fmai: number
  absorption: number
  sweep: number

  actionGateState: ActionGateState

  ts: number
}

/* ========================================================= */
let lastSnapshot: MarketSnapshot | null = null
let prevPrice = 0

/* ========================================================= */
function buildSnapshot(): MarketSnapshot {
  const market = useVIPMarketStore.getState()

  const price = market.price

  const priceChangePercent =
    prevPrice > 0
      ? ((price - prevPrice) / prevPrice) * 100
      : 0

  prevPrice = price

  return Object.freeze({
    oi: market.oi,
    oiDelta: market.oiDelta,

    volume: market.volume,
    volumeRatio: market.volumeRatio,

    fundingRate: market.fundingRate,
    fundingBias: market.fundingBias,

    price,
    priceChangePercent,

    whaleIntensity: market.whaleIntensity,
    whaleRatio: market.whaleRatio,
    whaleNet: market.whaleNet,
    whaleNetRatio: market.whaleNetRatio,

    fmai: market.fmai,
    absorption: market.absorption,
    sweep: market.sweep,

    actionGateState: market.actionGateState,

    ts: Math.floor(Date.now() / 3000),
  })
}

/* =========================================================
 🔥 Snapshot Getter (cache removed)
========================================================= */
export function getMarketSnapshot(): MarketSnapshot {
  return buildSnapshot()
}

/* ========================================================= */
export function resetMarketSnapshotCache() {
  lastSnapshot = null
  prevPrice = 0
}
