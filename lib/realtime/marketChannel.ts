import { sseManager } from './sseConnectionManager'
import { SSE_EVENT } from './types'

/**
 * =========================
 * Market: Open Interest
 * =========================
 */
export function subscribeOpenInterest(
  symbol: string,
  cb: (oi: number) => void,
) {
  return sseManager.subscribe(
    SSE_EVENT.OI_TICK,
    (data: {
      symbol: string
      openInterest: number
    }) => {
      if (data.symbol === symbol) {
        cb(data.openInterest)
      }
    },
  )
}

/**
 * =========================
 * Market: Price
 * =========================
 */
export function subscribeMarketPrice(
  symbol: string,
  cb: (price: number) => void,
) {
  return sseManager.subscribe(
    SSE_EVENT.PRICE_TICK,
    (data: {
      symbol: string
      price: number
    }) => {
      if (data.symbol === symbol) {
        cb(data.price)
      }
    },
  )
}

/**
 * =========================
 * Market: Volume
 * =========================
 */
export function subscribeMarketVolume(
  symbol: string,
  cb: (volume: number) => void,
) {
  return sseManager.subscribe(
    SSE_EVENT.VOLUME_TICK,
    (data: {
      symbol: string
      volume: number
    }) => {
      if (data.symbol === symbol) {
        cb(data.volume)
      }
    },
  )
}

/**
 * =========================
 * 🐋 Whale Pressure (Composite Index)
 * =========================
 */
export function subscribeWhaleIntensity(
  symbol: string,
  cb: (
    intensity: number,
    avg: number,
    trend: 'UP' | 'DOWN' | 'FLAT',
    isSpike: boolean,
    ts?: number,
  ) => void,
) {
  return sseManager.subscribe(
    SSE_EVENT.WHALE_INTENSITY,
    (data: {
      symbol: string
      intensity: number
      avg: number
      trend: 'UP' | 'DOWN' | 'FLAT'
      isSpike: boolean
      ts?: number
    }) => {
      if (data.symbol === symbol) {
        cb(
          data.intensity,
          data.avg,
          data.trend,
          data.isSpike,
          data.ts,
        )
      }
    },
  )
}

/**
 * =========================
 * 🆕 Whale Trade Flow (AggTrade 기반)
 * =========================
 */
export function subscribeWhaleTradeFlow(
  symbol: string,
  cb: (
    ratio: number,
    whaleVolume: number,
    totalVolume: number,
    ts?: number,
  ) => void,
) {
  return sseManager.subscribe(
    SSE_EVENT.WHALE_TRADE_FLOW,
    (data: {
      symbol: string
      ratio: number
      whaleVolume: number
      totalVolume: number
      ts?: number
    }) => {
      if (data.symbol === symbol) {
        cb(
          data.ratio,
          data.whaleVolume,
          data.totalVolume,
          data.ts,
        )
      }
    },
  )
}

/**
 * =========================
 * Market: Whale Warning (flag)
 * =========================
 */
export function subscribeWhaleWarning(
  symbol: string,
  cb: (value: number, avg: number, ts?: number) => void,
) {
  return sseManager.subscribe(
    SSE_EVENT.WHALE_WARNING,
    (data: {
      symbol: string
      whaleIntensity: number
      avgWhale: number
      ts?: number
    }) => {
      if (data.symbol === symbol) {
        cb(
          data.whaleIntensity,
          data.avgWhale,
          data.ts,
        )
      }
    },
  )
}

/**
 * =========================
 * 🔥 Market: Sentiment (Fear / Greed)
 * =========================
 */
export function subscribeSentiment(
  symbol: string,
  cb: (sentiment: number, ts?: number) => void,
) {
  return sseManager.subscribe(
    SSE_EVENT.SENTIMENT_UPDATE,
    (data: {
      symbol: string
      sentiment: number
      ts?: number
    }) => {
      if (data.symbol === symbol) {
        cb(data.sentiment, data.ts)
      }
    },
  )
}
