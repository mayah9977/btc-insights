import { create } from 'zustand'

export type VIPLevel = 'VIP1' | 'VIP2' | 'VIP3'
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'

type OverviewState = {
  // =========================
  // VIP 상태
  // =========================
  vipLevel: VIPLevel

  // =========================
  // 시장 요약
  // =========================
  riskLevel: RiskLevel
  warningCount30m: number
  nextEvaluationMinutes: number

  // =========================
  // Extreme / Stable Zone 요약
  // =========================
  averageReliability: number
  stableZoneActive: boolean

  // =========================
  // 🆕 Casino Production Layer 전용
  // =========================
  lastRiskChangeMinutes: number | null
  warningCountAfterExtreme: number
}

/**
 * ⚠️ SSOT: VIP Overview 단일 소스
 * - 계산 ❌
 * - 해석 ❌
 * - UI ❌
 * - "현재 상태 값"만 보관
 */
export const useVipOverviewStore = create<OverviewState>(() => ({
  // VIP 상태
  vipLevel: 'VIP3',

  // 시장 요약
  riskLevel: 'HIGH',
  warningCount30m: 3,
  nextEvaluationMinutes: 23,

  // Extreme / Stable Zone
  averageReliability: 0.32,
  stableZoneActive: true,

  // 🆕 Casino 연출용 상태 (사실 기반)
  lastRiskChangeMinutes: 18,
  warningCountAfterExtreme: 2,
}))
