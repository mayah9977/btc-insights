import { sseManager } from './sseConnectionManager'
import { SSE_EVENT } from './types'

/* =========================================================
 * 🔧 내부 유틸: Symbol 안전 비교
 * ========================================================= */
function isSameSymbol(a?: string, b?: string) {
  return a?.toUpperCase() === b?.toUpperCase()
}

/* =========================================================
 * Market: Open Interest (🔥 Drift 포함)
 * ========================================================= */
export function subscribeOpenInterest(
  symbol: string,
  cb: (
    openInterest: number,
    delta: number,
    direction: 'UP' | 'DOWN' | 'FLAT',
    ts?: number,
  ) => void,
) {
  const safeSymbol = symbol?.toUpperCase()

  return sseManager.subscribe(
    SSE_EVENT.OI_TICK,
    (data: {
      symbol: string
      openInterest: number
      delta: number
      direction: 'UP' | 'DOWN' | 'FLAT'
      ts?: number
    }) => {
      if (isSameSymbol(data.symbol, safeSymbol)) {
        cb(
          data.openInterest,
          data.delta,
          data.direction,
          data.ts,
        )
      }
    },
  )
}

/* =========================================================
 * Market: Price
 * ========================================================= */
export function subscribeMarketPrice(
  symbol: string,
  cb: (price: number, ts?: number) => void,
) {
  const safeSymbol = symbol?.toUpperCase()

  return sseManager.subscribe(
    SSE_EVENT.PRICE_TICK,
    (data: {
      symbol: string
      price: number
      ts?: number
    }) => {
      if (isSameSymbol(data.symbol, safeSymbol)) {
        cb(data.price, data.ts)
      }
    },
  )
}

/* =========================================================
 * Market: Volume
 * ========================================================= */
export function subscribeMarketVolume(
  symbol: string,
  cb: (volume: number, ts?: number) => void,
) {
  const safeSymbol = symbol?.toUpperCase()

  return sseManager.subscribe(
    SSE_EVENT.VOLUME_TICK,
    (data: {
      symbol: string
      volume: number
      ts?: number
    }) => {
      if (isSameSymbol(data.symbol, safeSymbol)) {
        cb(data.volume, data.ts)
      }
    },
  )
}

/* =========================================================
 * 🐋 Whale Pressure (Composite Index)
 * ========================================================= */
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
  const safeSymbol = symbol?.toUpperCase()

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
      if (isSameSymbol(data.symbol, safeSymbol)) {
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

/* =========================================================
 * 🆕 Whale Trade Flow
 * ========================================================= */
export function subscribeWhaleTradeFlow(
  symbol: string,
  cb: (
    ratio: number,
    whaleVolume: number,
    totalVolume: number,
    ts?: number,
  ) => void,
) {
  const safeSymbol = symbol?.toUpperCase()

  return sseManager.subscribe(
    SSE_EVENT.WHALE_TRADE_FLOW,
    (data: {
      symbol: string
      ratio: number
      whaleVolume: number
      totalVolume: number
      ts?: number
    }) => {
      if (isSameSymbol(data.symbol, safeSymbol)) {
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

/* =========================================================
 * Whale Warning
 * ========================================================= */
export function subscribeWhaleWarning(
  symbol: string,
  cb: (value: number, avg: number, ts?: number) => void,
) {
  const safeSymbol = symbol?.toUpperCase()

  return sseManager.subscribe(
    SSE_EVENT.WHALE_WARNING,
    (data: {
      symbol: string
      whaleIntensity: number
      avgWhale: number
      ts?: number
    }) => {
      if (isSameSymbol(data.symbol, safeSymbol)) {
        cb(
          data.whaleIntensity,
          data.avgWhale,
          data.ts,
        )
      }
    },
  )
}

/* =========================================================
 * 🔥 Market: Sentiment
 * ========================================================= */
export function subscribeSentiment(
  symbol: string,
  cb: (sentiment: number, ts?: number) => void,
) {
  const safeSymbol = symbol?.toUpperCase()

  return sseManager.subscribe(
    SSE_EVENT.SENTIMENT_UPDATE,
    (data: {
      symbol: string
      sentiment: number
      ts?: number
    }) => {
      if (isSameSymbol(data.symbol, safeSymbol)) {
        cb(data.sentiment, data.ts)
      }
    },
  )
}
