export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'

type RiskInput = {
  volatility: number        // 0 ~ 1
  aiScore: number           // 0 ~ 100
  whaleIntensity: number    // 0 ~ 1
  fundingRate?: number     // 절대값 기준
  extremeSignal?: boolean
}

/**
 * VIP Risk Level 계산 엔진 (SSOT)
 *
 * 역할:
 * - 수치 기반 RiskLevel 산출 전용
 * - LOW / MEDIUM / HIGH / EXTREME 만 결정
 *
 * ❌ 전략 문장 생성
 * ❌ UI 해석
 * ❌ 사용자 메시지 생성
 *
 * 👉 전략 문장은 vipJudgementEngine.ts 에서만 생성
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
     1️⃣ Hard Stop (결합 조건만 허용)
     - 단독 EXTREME 금지
  ========================= */
  if (extremeSignal && volatility > 0.6 && whaleIntensity > 0.7) {
    return 'EXTREME'
  }

  if (
    Math.abs(fundingRate) > 0.06 &&
    volatility > 0.5 &&
    whaleIntensity > 0.65
  ) {
    return 'EXTREME'
  }

  /* =========================
     2️⃣ Composite Risk Index
     - whaleIntensity 가중치 제한
  ========================= */
  const riskIndex =
    volatility * 0.5 +
    Math.min(whaleIntensity, 0.8) * 0.25 +
    (1 - aiScore / 100) * 0.25

  /* =========================
     3️⃣ Base Risk Mapping
  ========================= */
  let baseRisk: RiskLevel =
    riskIndex >= 0.75 ? 'EXTREME' :
    riskIndex >= 0.6  ? 'HIGH' :
    riskIndex >= 0.4  ? 'MEDIUM' :
                        'LOW'

  /* =========================
     4️⃣ Whale Acceleration (단계 보정)
     - 단독 승격 금지
     - 최대 1단계만 허용
  ========================= */
  if (whaleIntensity > 0.85 && volatility > 0.35) {
    if (baseRisk === 'MEDIUM') return 'HIGH'
    if (baseRisk === 'HIGH') return 'EXTREME'
  }

  return baseRisk
}
