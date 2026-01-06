import type { RiskLevel } from './riskEngine'

export type ScenarioInput = {
  id: string
  title: string
  description: string
  baseProbability: number // 0 ~ 100
  tone: 'bull' | 'bear' | 'neutral'
}

/**
 * RiskLevel에 따라 시나리오 확률 가중치 적용
 * - EXTREME에서도 완전 무력화 방지
 * - UI 신뢰도 유지
 */
export function applyRiskWeight(
  scenarios: ScenarioInput[],
  riskLevel: RiskLevel
): ScenarioInput[] {
  const multiplierMap: Record<RiskLevel, number> = {
    LOW: 1,
    MEDIUM: 0.9,
    HIGH: 0.78,
    EXTREME: 0.65,
  }

  const multiplier = multiplierMap[riskLevel]

  return scenarios.map((s) => {
    const weighted = Math.round(s.baseProbability * multiplier)

    return {
      ...s,
      baseProbability: Math.max(
        riskLevel === 'EXTREME' ? 5 : 0, // 🔒 EXTREME 하한
        Math.min(100, weighted)
      ),
    }
  })
}
