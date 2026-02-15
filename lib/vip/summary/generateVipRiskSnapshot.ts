// lib/vip/summary/generateVipRiskSnapshot.ts

import type { RiskLevel } from '@/lib/vip/riskTypes'

/* =========================
 * Types
 * ========================= */

export type VipRiskSnapshot = {
  ts: number
  riskLevel: RiskLevel
  summary: string
  confidence: number
  isExtreme: boolean
  preExtreme?: boolean
  pressureTrend?: 'UP' | 'DOWN' | 'STABLE'
  whaleAccelerated?: boolean
}

/* =========================
 * Snapshot Generator (DISABLED)
 * ========================= */

/**
 * 🔒 서버 전용 Snapshot Generator
 *
 * ⚠ 현재 앱 구조와 맞지 않아 완전 비활성화됨
 *
 * - 실제 Risk 계산 ❌
 * - judgement 반영 ❌
 * - preExtreme 로직 ❌
 * - whale 가속 반영 ❌
 *
 * 👉 항상 중립 상태 반환
 */
export function generateVipRiskSnapshot(): VipRiskSnapshot {
  return {
    ts: Date.now(),

    // 항상 가장 안전한 기본값
    riskLevel: 'LOW',

    // 완전 중립 요약
    summary: 'Risk snapshot 기능이 비활성화되어 있습니다.',

    confidence: 0,

    isExtreme: false,
    preExtreme: false,
    pressureTrend: 'STABLE',
    whaleAccelerated: false,
  }
}
