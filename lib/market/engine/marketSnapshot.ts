// lib/market/engine/marketSnapshot.ts

/* =========================================================
 Market Snapshot Engine
 FINAL - Institutional Velocity Layer
========================================================= */

import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

import {
  FundingBias,
  ActionGateState,
} from '@/lib/market/store/vipMarketStore'

export interface MarketSnapshot {
  oi: number
  oiDelta: number

  /**
   * 🔥 OI velocity layer
   */
  oiExpansionVelocity: number
  oiCompressionVelocity: number
  oiTrendStrength: number
  oiDirectionalPersistence: number

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

let prevPrice = 0
let prevOIDelta = 0
let prevMarketTs = 0
let oiDirectionPersistence = 0

let lastOIExpansionVelocity = 0
let lastOICompressionVelocity = 0
let lastOITrendStrength = 0
let lastOIDirectionalPersistence = 0

/* ========================================================= */

function buildSnapshot(): MarketSnapshot {
  const market = useVIPMarketStore.getState()

  const price = market.price

  const priceChangePercent =
    prevPrice > 0
      ? ((price - prevPrice) / prevPrice) * 100
      : 0

  prevPrice = price

  /**
   * 🔥 OI Velocity Layer
   *
   * market.ts가 바뀐 경우에만 velocity를 재계산합니다.
   * getMarketSnapshot()이 여러 번 호출되어도
   * oiDirectionalPersistence가 인위적으로 증가하지 않도록 보호합니다.
   */
  const currentOIDelta = Number(
    market.oiDelta ?? 0,
  )

  if (market.ts !== prevMarketTs) {
    const oiVelocity =
      currentOIDelta - prevOIDelta

    lastOIExpansionVelocity =
      oiVelocity > 0
        ? oiVelocity
        : 0

    lastOICompressionVelocity =
      oiVelocity < 0
        ? Math.abs(oiVelocity)
        : 0

    lastOITrendStrength = Math.min(
      Math.abs(currentOIDelta) * 1000,
      100,
    )

    const sameDirection =
      (currentOIDelta >= 0 &&
        prevOIDelta >= 0) ||
      (currentOIDelta <= 0 &&
        prevOIDelta <= 0)

    if (sameDirection) {
      oiDirectionPersistence += 1
    } else {
      oiDirectionPersistence = 0
    }

    lastOIDirectionalPersistence =
      Math.min(
        oiDirectionPersistence / 10,
        1,
      )

    prevOIDelta = currentOIDelta
    prevMarketTs = market.ts
  }

  return Object.freeze({
    oi: market.oi,

    oiDelta: currentOIDelta,

    /**
     * 🔥 OI velocity layer
     */
    oiExpansionVelocity:
      lastOIExpansionVelocity,

    oiCompressionVelocity:
      lastOICompressionVelocity,

    oiTrendStrength:
      lastOITrendStrength,

    oiDirectionalPersistence:
      lastOIDirectionalPersistence,

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

    actionGateState:
      market.actionGateState,

    ts: Math.floor(Date.now() / 3000),
  })
}

/* =========================================================
 🔥 Snapshot Getter
========================================================= */

export function getMarketSnapshot(): MarketSnapshot {
  return buildSnapshot()
}

/* ========================================================= */

export function resetMarketSnapshotCache() {
  prevPrice = 0
  prevOIDelta = 0
  prevMarketTs = 0
  oiDirectionPersistence = 0

  lastOIExpansionVelocity = 0
  lastOICompressionVelocity = 0
  lastOITrendStrength = 0
  lastOIDirectionalPersistence = 0
}
