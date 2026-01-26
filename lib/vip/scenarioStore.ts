// lib/vip/scenarioStore.ts
import { create } from 'zustand'

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'

export type HeatmapCell = {
  hour: number // 0~23
  risk: RiskLevel
  scenarioBias: 'bull' | 'bear' | 'neutral'
}

type ScenarioState = {
  heatmap: HeatmapCell[]

  // 🔥 외부에서 동기화용 setter
  setHeatmap: (next: HeatmapCell[]) => void
  reset: () => void
}

/**
 * ⚠️ SSOT: VIP 시나리오 단일 소스
 * - 계산 ❌
 * - 해석 ❌
 * - UI ❌
 * - 실시간 Risk Sync 결과만 저장
 */
export const useVipScenarioStore =
  create<ScenarioState>((set) => ({
    // ❗️초기값은 비어있어야 함
    heatmap: [],

    setHeatmap: (next) =>
      set({
        heatmap: next,
      }),

    reset: () =>
      set({
        heatmap: [],
      }),
  }))
