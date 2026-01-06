export type VipMarketState =
  | 'SAFE'
  | 'CAUTION'
  | 'DANGER'
  | 'OVERHEAT'

type Params = {
  aiScore: number
  whaleIntensity: number // 0 ~ 1
  volatility: number     // 0 ~ 1
}

export function judgeVipMarketState({
  aiScore,
  whaleIntensity,
  volatility,
}: Params): VipMarketState {
  /**
   * 🔬 Composite Risk Index
   * - volatility: 시장 불안정성
   * - whaleIntensity: 대형 자금 개입 강도
   * - aiScore: 추세 신뢰도 (역가중)
   */
  const riskIndex =
    volatility * 0.45 +
    whaleIntensity * 0.35 +
    (1 - aiScore / 100) * 0.2

  // 🔥 과열: 변동성 + 고래 동시 폭증
  if (riskIndex >= 0.78) return 'OVERHEAT'

  // ⚠️ 위험: 변동성 우세
  if (riskIndex >= 0.6) return 'DANGER'

  // ⚠️ 주의: 추세 신뢰도 부족
  if (riskIndex >= 0.42) return 'CAUTION'

  // ✅ 안정
  return 'SAFE'
}
