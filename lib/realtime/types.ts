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
  BB_SIGNAL: 'BB_SIGNAL',

  // 🔥 NEW: SENTIMENT
  SENTIMENT_UPDATE: 'SENTIMENT_UPDATE',

  // =========================
  // WHALE
  // =========================
  WHALE_INTENSITY: 'WHALE_INTENSITY',
  WHALE_WARNING: 'WHALE_WARNING',

  // =========================
  // ALERTS
  // =========================
  ALERT_TRIGGERED: 'ALERT_TRIGGERED',

  // =========================
  // VIP3
  // =========================
  VIP3_EVENT: 'VIP3_EVENT',
} as const

/**
 * =========================
 * VIP SSE Event Union
 * =========================
 */
export type VipSSEEvent =
  | {
      type: typeof SSE_EVENT.VIP_LEVEL
      vipLevel: VIPLevel
    }
  | {
      /**
       * 🔥 VIP Risk Update (Server SSOT 최종본)
       */
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
  | {
      /**
       * 🐋 Whale Intensity
       */
      type: typeof SSE_EVENT.WHALE_INTENSITY
      symbol: string
      intensity: number
      avg: number
      trend: 'UP' | 'DOWN' | 'FLAT'
      isSpike: boolean
      ts: number
    }
  | {
      /**
       * 🐋 Whale Warning
       */
      type: typeof SSE_EVENT.WHALE_WARNING
      symbol: string
      whaleIntensity: number
      avgWhale: number
      tradeUSD?: number
      ts: number
    }
  | {
      /**
       * 📊 Market Volume (실시간 체결량)
       */
      type: typeof SSE_EVENT.VOLUME_TICK
      symbol: string
      volume: number
      ts: number
    }
  | {
      /**
       * 📈 Bollinger Bands Signal (15m, Real-time)
       */
      type: typeof SSE_EVENT.BB_SIGNAL
      symbol: string
      timeframe: '15m'
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
      /**
       * 🔥 Market Sentiment Update (Fear / Greed Index)
       */
      type: typeof SSE_EVENT.SENTIMENT_UPDATE
      symbol: string
      sentiment: number // 0 ~ 100
      ts: number
    }
