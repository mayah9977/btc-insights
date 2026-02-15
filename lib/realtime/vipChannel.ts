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
 * VIP Risk (🔥 서버 SSOT 수신)
 * =========================
 */
export type VipRiskUpdatePayload = {
  // ===== 핵심 판단 =====
  riskLevel: RiskLevel
  judgement: string
  confidence: number        // ✅ 추가됨 (0 ~ 1)

  isExtreme: boolean
  ts: number

  /* =========================
   * 🔥 해석 확장 필드 (UI 전용)
   * ========================= */
  pressureTrend?: 'UP' | 'DOWN' | 'STABLE'
  extremeProximity?: number   // 0 ~ 1
  preExtreme?: boolean        // EXTREME 직전
  whaleAccelerated?: boolean  // 고래 가속 힌트
}

export function subscribeVipRisk(
  cb: (data: VipRiskUpdatePayload) => void,
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
