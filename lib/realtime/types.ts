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
  WHALE_INTENSITY: 'WHALE_INTENSITY',
  WHALE_WARNING: 'WHALE_WARNING',

  // =========================
  // ALERTS
  // =========================
  ALERT_TRIGGERED: 'ALERT_TRIGGERED',

  // =========================
  // VIP3 (recommended)
  // =========================
  VIP3_EVENT: 'VIP3_EVENT',
} as const

export type VipSSEEvent =
  | { type: typeof SSE_EVENT.VIP_LEVEL; vipLevel: VIPLevel }
  | {
      type: typeof SSE_EVENT.RISK_UPDATE
      riskLevel: RiskLevel
      isExtreme: boolean
      ts: number
    }
  | { type: typeof SSE_EVENT.VIP_KPI_UPDATE; kpi: any }
  | { type: typeof SSE_EVENT.HEARTBEAT; ts: number }
