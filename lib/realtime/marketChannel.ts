// lib/realtime/marketChannel.ts
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
 * Market: Whale Intensity (tick)
 * =========================
 */
export function subscribeWhaleIntensity(
  symbol: string,
  cb: (value: number, ts?: number) => void,
) {
  return sseManager.subscribe(
    SSE_EVENT.WHALE_INTENSITY,
    (data: {
      symbol: string
      intensity: number
      ts?: number
    }) => {
      if (data.symbol === symbol) {
        cb(data.intensity, data.ts)
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
