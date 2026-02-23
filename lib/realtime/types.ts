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

  // 🔥 SENTIMENT
  SENTIMENT_UPDATE: 'SENTIMENT_UPDATE',

  // =========================
  // WHALE (Pressure Index)
  // =========================
  WHALE_INTENSITY: 'WHALE_INTENSITY',
  WHALE_WARNING: 'WHALE_WARNING',

  // =========================
  // 🆕 WHALE (Trade Flow Index)
  // =========================
  WHALE_TRADE_FLOW: 'WHALE_TRADE_FLOW',

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
 * VIP + REALTIME SSE Event Union
 * =========================
 */
export type VipSSEEvent =
  | {
      type: typeof SSE_EVENT.VIP_LEVEL
      vipLevel: VIPLevel
    }
  | {
      /**
       * 🔥 VIP Risk Update (Server SSOT)
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

  // =========================================================
  // 🐋 Whale Pressure Index (기존 유지)
  // =========================================================
  | {
      type: typeof SSE_EVENT.WHALE_INTENSITY
      symbol: string
      intensity: number        // 0 ~ 1 (Composite Pressure)
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

  // =========================================================
  // 🆕 Whale Trade Flow Index (aggTrade 기반)
  // =========================================================
  | {
      type: typeof SSE_EVENT.WHALE_TRADE_FLOW
      symbol: string
      ratio: number            // 0 ~ 1 (WhaleVolume / TotalVolume)
      whaleVolume: number      // 고래 체결 총합 (USDT)
      totalVolume: number      // 전체 체결 총합 (USDT)
      ts: number
    }

  // =========================================================
  // MARKET
  // =========================================================
  | {
      type: typeof SSE_EVENT.VOLUME_TICK
      symbol: string
      volume: number
      ts: number
    }
  | {
      type: typeof SSE_EVENT.OI_TICK
      symbol: string
      openInterest: number
      ts: number
    }
  | {
      type: typeof SSE_EVENT.PRICE_TICK
      symbol: string
      price: number
      ts: number
    }
  | {
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
      type: typeof SSE_EVENT.SENTIMENT_UPDATE
      symbol: string
      sentiment: number // 0 ~ 100
      ts: number
    }
    