// lib/vip/vipLastRiskStore.ts

import type { RiskLevel } from '@/lib/vip/vipSSEHub'

/**
 * 🔥 VIP Last Risk SSOT (Server Memory)
 *
 * 목적:
 * - 가장 마지막 Risk 상태를 서버에 저장
 * - SSE 신규 연결 시 즉시 push
 * - 재시작 전까지는 항상 유지
 */

export type LastVipRiskSnapshot = {
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

/**
 * 🔒 module-level singleton
 */
let lastRisk: LastVipRiskSnapshot | null = null

/* =========================
 * SET (서버에서 Risk 생성 시)
 * ========================= */
export function setLastVipRisk(
  snapshot: LastVipRiskSnapshot,
) {
  lastRisk = snapshot
}

/* =========================
 * GET (SSE 연결 시)
 * ========================= */
export function getLastVipRisk():
  | LastVipRiskSnapshot
  | null {
  return lastRisk
}

/* =========================
 * CLEAR (테스트 / 리셋용)
 * ========================= */
export function clearLastVipRisk() {
  lastRisk = null
}
