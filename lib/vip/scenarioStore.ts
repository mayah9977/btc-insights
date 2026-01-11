import { create } from 'zustand'

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'

export type HeatmapCell = {
  hour: number // 0~23
  risk: RiskLevel
  scenarioBias: 'bull' | 'bear' | 'neutral'
}

type ScenarioState = {
  heatmap: HeatmapCell[]
}

/**
 * ⚠️ SSOT: VIP 시나리오 단일 소스
 * - 계산 ❌
 * - 해석 ❌
 * - UI에 필요한 형태 그대로 저장
 */
export const useVipScenarioStore = create<ScenarioState>(() => ({
  heatmap: [
    { hour: 9, risk: 'MEDIUM', scenarioBias: 'neutral' },
    { hour: 10, risk: 'HIGH', scenarioBias: 'bear' },
    { hour: 11, risk: 'HIGH', scenarioBias: 'bear' },
    { hour: 12, risk: 'EXTREME', scenarioBias: 'bear' },
    { hour: 13, risk: 'HIGH', scenarioBias: 'neutral' },
    { hour: 14, risk: 'MEDIUM', scenarioBias: 'bull' },
  ],
}))
