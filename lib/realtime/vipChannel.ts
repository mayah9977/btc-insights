// lib/realtime/vipChannel.ts
import { sseManager } from './sseConnectionManager'
import { SSE_EVENT } from './types'
import type { VIPLevel } from '@/lib/vip/vipTypes'
import type { RiskLevel } from '@/lib/vip/riskTypes'

/**
 * =========================
 * VIP Level
 * =========================
 */
export function subscribeVipLevel(
  cb: (vipLevel: VIPLevel) => void,
) {
  return sseManager.subscribe(
    SSE_EVENT.VIP_LEVEL,
    (data: { vipLevel: VIPLevel }) => {
      cb(data.vipLevel)
    },
  )
}

/**
 * =========================
 * VIP Risk (🔥 required)
 * =========================
 */
export function subscribeVipRisk(
  cb: (data: {
    riskLevel: RiskLevel
    judgement?: string
    scenarios?: any[]
    isExtreme: boolean
    ts: number
  }) => void,
) {
  return sseManager.subscribe(
    SSE_EVENT.RISK_UPDATE,
    cb,
  )
}

/**
 * =========================
 * VIP KPI
 * =========================
 */
export function subscribeVipKpi(
  cb: (kpi: any) => void,
) {
  return sseManager.subscribe(
    SSE_EVENT.VIP_KPI_UPDATE,
    (data: { kpi: any }) => {
      cb(data.kpi)
    },
  )
}
