import type { RiskLevel } from './riskEngine'

export type GeneratedScenario = {
  id: string
  title: string
  description: string
  probability: number // 0 ~ 100
  tone: 'bull' | 'bear' | 'neutral'
}

type Params = {
  riskLevel: RiskLevel
  trendScore: number   // -1 ~ 1
  volatility: number   // 0 ~ 1
}

function clamp(n: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, n))
}

export function generateVipScenarios({
  riskLevel,
  trendScore,
  volatility,
}: Params): GeneratedScenario[] {
  // 리스크별 기준 확률
  const baseMap: Record<RiskLevel, number> = {
    LOW: 60,
    MEDIUM: 50,
    HIGH: 40,
    EXTREME: 30,
  }

  const base = baseMap[riskLevel]

  const trendProb = clamp(
    base + trendScore * 20 - volatility * 10
  )

  const fakeBreakProb = clamp(
    100 - base + volatility * 30
  )

  return [
    {
      id: 'trend-follow',
      title:
        trendScore >= 0
          ? '추세 지속 시 상승'
          : '추세 유지 시 하락',
      description:
        '현재 추세가 유지될 경우 가격이 동일 방향으로 전개될 가능성',
      probability: trendProb,
      tone: trendScore >= 0 ? 'bull' : 'bear',
    },
    {
      id: 'fake-break',
      title: '돌파 실패 → 반대 방향 급변',
      description:
        '변동성 확대로 돌파가 실패할 경우 급격한 반전이 발생할 가능성',
      probability: fakeBreakProb,
      tone: 'neutral',
    },
  ]
}
