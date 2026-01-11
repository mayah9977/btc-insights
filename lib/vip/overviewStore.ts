import { create } from 'zustand'

export type VIPLevel = 'VIP1' | 'VIP2' | 'VIP3'
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'

type OverviewState = {
  // VIP 상태
  vipLevel: VIPLevel

  // 요약 정보
  riskLevel: RiskLevel
  warningCount30m: number
  nextEvaluationMinutes: number

  // Extreme 요약
  averageReliability: number
  stableZoneActive: boolean
}

/**
 * ⚠️ SSOT: VIP Overview 단일 소스
 * - 계산 ❌
 * - 해석 ❌
 * - UI ❌
 */
export const useVipOverviewStore = create<OverviewState>(() => ({
  vipLevel: 'VIP3',

  riskLevel: 'HIGH',
  warningCount30m: 3,
  nextEvaluationMinutes: 23,

  averageReliability: 0.32,
  stableZoneActive: true,
}))
