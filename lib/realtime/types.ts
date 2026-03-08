import type { VIPLevel } from '@/lib/vip/vipTypes'
import type { RiskLevel } from '@/lib/vip/riskTypes'

export const SSE_EVENT = {

  // =========================
  // VIP
  // =========================
  VIP_LEVEL: 'VIP_LEVEL',
  RISK_UPDATE: 'RISK_UPDATE',
  VIP_KPI_UPDATE: 'VIP_KPI_UPDATE',
  HEARTBEAT: 'HEARTBEAT',

  // =========================
  // MARKET
  // =========================
  OI_TICK: 'OI_TICK',
  PRICE_TICK: 'PRICE_TICK',
  VOLUME_TICK: 'VOLUME_TICK',
  FUNDING_RATE_TICK: 'FUNDING_RATE_TICK',
  BB_SIGNAL: 'BB_SIGNAL',
  BB_LIVE_COMMENTARY: 'BB_LIVE_COMMENTARY',

  // 🔥 SENTIMENT
  SENTIMENT_UPDATE: 'SENTIMENT_UPDATE',

  // =========================
  // WHALE
  // =========================
  WHALE_INTENSITY: 'WHALE_INTENSITY',
  WHALE_WARNING: 'WHALE_WARNING',
  WHALE_TRADE_FLOW: 'WHALE_TRADE_FLOW',

  // 🆕🔥 기관 순매수 압력
  WHALE_NET_PRESSURE: 'WHALE_NET_PRESSURE',

  // 🆕🔥 NEW ENGINE EVENTS
  WHALE_ABSORPTION: 'WHALE_ABSORPTION',
  MARKET_REGIME: 'MARKET_REGIME',
  LIQUIDITY_SWEEP: 'LIQUIDITY_SWEEP',

  // =========================
  // ALERTS
  // =========================
  ALERT_TRIGGERED: 'ALERT_TRIGGERED',

  // =========================
  // VIP3
  // =========================
  VIP3_EVENT: 'VIP3_EVENT',

} as const


/* =========================================================
 * 🔥 VIP + REALTIME SSE Event Union
 * ========================================================= */

export type VipSSEEvent =

  /* =========================
   * VIP
   * ========================= */

  | {
      type: typeof SSE_EVENT.VIP_LEVEL
      vipLevel: VIPLevel
    }

  | {
      type: typeof SSE_EVENT.RISK_UPDATE
      riskLevel: RiskLevel
      judgement: string
      confidence: number
      isExtreme: boolean
      ts: number
      pressureTrend?: 'UP' | 'DOWN' | 'STABLE'
      extremeProximity?: number
      preExtreme?: boolean
      whaleAccelerated?: boolean
    }

  | {
      type: typeof SSE_EVENT.VIP_KPI_UPDATE
      kpi: any
    }

  | {
      type: typeof SSE_EVENT.HEARTBEAT
      ts: number
    }


  /* =========================================================
   * 🐋 Whale Pressure Index
   * ========================================================= */

  | {
      type: typeof SSE_EVENT.WHALE_INTENSITY
      symbol: string
      intensity: number
      avg: number
      trend: 'UP' | 'DOWN' | 'FLAT'
      isSpike: boolean
      ts: number
    }

  | {
      type: typeof SSE_EVENT.WHALE_WARNING
      symbol: string
      whaleIntensity: number
      avgWhale: number
      tradeUSD?: number
      ts: number
    }


  /* =========================================================
   * 🆕 Whale Trade Flow
   * ========================================================= */

  | {
      type: typeof SSE_EVENT.WHALE_TRADE_FLOW
      symbol: string
      ratio: number
      whaleVolume: number
      totalVolume: number
      ts: number
    }


  /* =========================================================
   * 🆕🔥 Whale Net Pressure
   * ========================================================= */

  | {
      type: typeof SSE_EVENT.WHALE_NET_PRESSURE
      symbol: string
      whaleBuyVolume: number
      whaleSellVolume: number
      whaleNetPressure: number
      whaleNetRatio: number
      totalVolume: number
      ts: number
    }


  /* =========================================================
   * 🆕🔥 Whale Absorption
   * ========================================================= */

  | {
      type: typeof SSE_EVENT.WHALE_ABSORPTION
      symbol: string
      direction: 'LONG' | 'SHORT'
      strength: number
      confidence: number
      ts: number
    }


  /* =========================================================
   * 🆕🔥 Market Regime
   * ========================================================= */

  | {
      type: typeof SSE_EVENT.MARKET_REGIME
      symbol: string
      regime: 'TREND' | 'RANGE' | 'VOLATILE'
      strength: number
      confidence: number
      ts: number
    }


  /* =========================================================
   * 🆕🔥 Liquidity Sweep
   * ========================================================= */

  | {
      type: typeof SSE_EVENT.LIQUIDITY_SWEEP
      symbol: string
      direction: 'SWEEP_UP' | 'SWEEP_DOWN'
      strength: number
      confidence: number
      ts: number
    }


  /* =========================================================
   * MARKET
   * ========================================================= */

  | {
      type: typeof SSE_EVENT.OI_TICK
      symbol: string
      openInterest: number
      delta: number
      direction: 'UP' | 'DOWN' | 'FLAT'
      ts: number
    }

  | {
      type: typeof SSE_EVENT.VOLUME_TICK
      symbol: string
      volume: number
      ts: number
    }

  | {
      type: typeof SSE_EVENT.PRICE_TICK
      symbol: string
      price: number
      ts: number
    }

  | {
      type: typeof SSE_EVENT.FUNDING_RATE_TICK
      symbol: string
      fundingRate: number
      ts: number
    }


  /* =========================================================
   * 🔥 Bollinger (30m)
   * ========================================================= */

  | {
      type: typeof SSE_EVENT.BB_SIGNAL
      symbol: string
      timeframe: '30m'
      action:
        | 'REDUCE_POSITION'
        | 'SPLIT_BUY'
        | 'BUY_WITH_CAUTION'
        | 'SELL_WITH_CAUTION'
        | 'ENTRY_AFTER_REENTRY'
      message: string
      price: number
      upperBand: number
      middleBand: number
      lowerBand: number
      ts: number
    }

  | {
      type: typeof SSE_EVENT.BB_LIVE_COMMENTARY
      symbol: string
      signalType: string
      confirmed: boolean
      timeframe: '30m'
      message: string
      ts: number
    }


  /* =========================================================
   * 🔥 SENTIMENT
   * ========================================================= */

  | {
      type: typeof SSE_EVENT.SENTIMENT_UPDATE
      symbol: string
      sentiment: number
      ts: number
    }


  /* =========================================================
   * ALERT
   * ========================================================= */

  | {
      type: typeof SSE_EVENT.ALERT_TRIGGERED
      id: string
      message: string
      ts: number
    }
    