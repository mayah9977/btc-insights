export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'

type RiskInput = {
  volatility: number        // 0 ~ 1
  aiScore: number           // 0 ~ 100
  whaleIntensity: number    // 0 ~ 1
  fundingRate?: number     // 절대값 기준
  extremeSignal?: boolean
}

/**
 * VIP Risk 자동 판단 엔진
 * - 수치 안정성
 * - 임계값 튐 방지
 * - UI/문장 공용 사용
 */
export function calculateRiskLevel(input: RiskInput): RiskLevel {
  const {
    volatility,
    aiScore,
    whaleIntensity,
    fundingRate = 0,
    extremeSignal = false,
  } = input

  /* =========================
     1️⃣ 즉시 차단 (Hard Stop)
  ========================= */
  if (extremeSignal && volatility > 0.75) {
    return 'EXTREME'
  }

  if (Math.abs(fundingRate) > 0.06 && whaleIntensity > 0.65) {
    return 'EXTREME'
  }

  /* =========================
     2️⃣ Composite Risk Index
  ========================= */
  const riskIndex =
    volatility * 0.45 +
    whaleIntensity * 0.35 +
    (1 - aiScore / 100) * 0.2

  /* =========================
     3️⃣ Risk Level Mapping
  ========================= */
  if (riskIndex >= 0.75) return 'EXTREME'
  if (riskIndex >= 0.6) return 'HIGH'
  if (riskIndex >= 0.4) return 'MEDIUM'
  return 'LOW'
}
