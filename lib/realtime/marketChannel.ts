import { sseManager } from './sseConnectionManager'
import { SSE_EVENT } from './types'

/* =========================================================
 * 🔧 내부 유틸: Symbol 안전 비교
========================================================= */
function isSameSymbol(a?: string, b?: string) {
  return a?.toUpperCase() === b?.toUpperCase()
}

/* =========================================================
 * 🔥 FMAI (VIP 채널)
========================================================= */
export function subscribeVIPChannel(
  symbol: string,
  cb: (
    score: number,
    direction: string,
    ts?: number,
  ) => void,
) {

  const safeSymbol = symbol?.toUpperCase()

  return sseManager.subscribe(
    'FMAI',
    (data: {
      symbol: string
      score: number
      direction: string
      ts?: number
    }) => {

      if (isSameSymbol(data.symbol, safeSymbol)) {
        cb(data.score, data.direction, data.ts)
      }

    },
  )
}

/* =========================================================
 * 🏦 Institutional Accumulation
========================================================= */
export function subscribeInstitutionalAccumulation(
  symbol: string,
  cb: (
    direction: 'LONG' | 'SHORT',
    confidence: number,
    ts?: number,
  ) => void,
) {

  const safeSymbol = symbol?.toUpperCase()

  return sseManager.subscribe(
    'INSTITUTIONAL_ACCUMULATION',
    (data: {
      symbol: string
      direction: 'LONG' | 'SHORT'
      confidence: number
      ts?: number
    }) => {

      if (isSameSymbol(data.symbol, safeSymbol)) {

        cb(
          data.direction,
          data.confidence,
          data.ts,
        )

      }

    },
  )
}

/* =========================================================
 * Market: Open Interest
========================================================= */
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
========================================================= */
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
========================================================= */
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
 * 🐋 Whale Intensity
========================================================= */
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
 * Whale Trade Flow
========================================================= */
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
 * Whale Net Pressure
========================================================= */
export function subscribeWhaleNetPressure(
  symbol: string,
  cb: (
    whaleBuyVolume: number,
    whaleSellVolume: number,
    whaleNetPressure: number,
    whaleNetRatio: number,
    totalVolume: number,
    ts?: number,
  ) => void,
) {

  const safeSymbol = symbol?.toUpperCase()

  return sseManager.subscribe(
    SSE_EVENT.WHALE_NET_PRESSURE,
    (data: {
      symbol: string
      whaleBuyVolume: number
      whaleSellVolume: number
      whaleNetPressure: number
      whaleNetRatio: number
      totalVolume: number
      ts?: number
    }) => {

      if (isSameSymbol(data.symbol, safeSymbol)) {

        cb(
          data.whaleBuyVolume,
          data.whaleSellVolume,
          data.whaleNetPressure,
          data.whaleNetRatio,
          data.totalVolume,
          data.ts,
        )

      }

    },
  )
}

/* =========================================================
 * 🆕 Whale Absorption
========================================================= */
export function subscribeWhaleAbsorption(
  symbol: string,
  cb: (
    direction: 'LONG' | 'SHORT',
    strength: number,
    confidence: number,
    ts?: number,
  ) => void,
) {

  const safeSymbol = symbol?.toUpperCase()

  return sseManager.subscribe(
    SSE_EVENT.WHALE_ABSORPTION,
    (data: {
      symbol: string
      direction: 'LONG' | 'SHORT'
      strength: number
      confidence: number
      ts?: number
    }) => {

      if (isSameSymbol(data.symbol, safeSymbol)) {

        cb(
          data.direction,
          data.strength,
          data.confidence,
          data.ts,
        )

      }

    },
  )
}

/* =========================================================
 * 🆕 Market Regime
========================================================= */
export function subscribeMarketRegime(
  symbol: string,
  cb: (
    regime: 'TREND' | 'RANGE' | 'VOLATILE',
    strength: number,
    confidence: number,
    ts?: number,
  ) => void,
) {

  const safeSymbol = symbol?.toUpperCase()

  return sseManager.subscribe(
    SSE_EVENT.MARKET_REGIME,
    (data: {
      symbol: string
      regime: 'TREND' | 'RANGE' | 'VOLATILE'
      strength: number
      confidence: number
      ts?: number
    }) => {

      if (isSameSymbol(data.symbol, safeSymbol)) {

        cb(
          data.regime,
          data.strength,
          data.confidence,
          data.ts,
        )

      }

    },
  )
}

/* =========================================================
 * 🆕 Liquidity Sweep
========================================================= */
export function subscribeLiquiditySweep(
  symbol: string,
  cb: (
    direction: 'SWEEP_UP' | 'SWEEP_DOWN',
    strength: number,
    confidence: number,
    ts?: number,
  ) => void,
) {

  const safeSymbol = symbol?.toUpperCase()

  return sseManager.subscribe(
    SSE_EVENT.LIQUIDITY_SWEEP,
    (data: {
      symbol: string
      direction: 'SWEEP_UP' | 'SWEEP_DOWN'
      strength: number
      confidence: number
      ts?: number
    }) => {

      if (isSameSymbol(data.symbol, safeSymbol)) {

        cb(
          data.direction,
          data.strength,
          data.confidence,
          data.ts,
        )

      }

    },
  )
}

/* =========================================================
 * Whale Warning
========================================================= */
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
 * 🔥 Market Sentiment
========================================================= */
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

/* =========================================================
 * 🆕 MARKET_STATE
========================================================= */
export function subscribeMarketState(
  symbol: string,
  cb: (
    actionGateState: string,
    macd: any,
    ts?: number,
  ) => void,
) {

  const safeSymbol = symbol?.toUpperCase()

  return sseManager.subscribe(
    'MARKET_STATE',
    (data: {
      symbol: string
      actionGateState: string
      macd: any
      ts?: number
    }) => {

      if (isSameSymbol(data.symbol, safeSymbol)) {
        cb(data.actionGateState, data.macd, data.ts)
      }

    },
  )
}

/* =========================================================
 * 🔥 FINAL_DECISION
========================================================= */
export function subscribeFinalDecision(
  symbol: string,
  cb: (
    decision: string,
    dominant: string,
    confidence: number,
    ts?: number,
  ) => void,
) {

  const safeSymbol = symbol?.toUpperCase()

  return sseManager.subscribe(
    'FINAL_DECISION',
    (data: {
      symbol: string
      decision: string
      dominant: string
      confidence: number
      ts?: number
    }) => {

      if (isSameSymbol(data.symbol, safeSymbol)) {

        cb(
          data.decision,
          data.dominant,
          data.confidence,
          data.ts,
        )

      }

    },
  )
}
