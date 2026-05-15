// lib/vip/riskEngine.ts

export type RiskLevel =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'EXTREME'

type RiskInput = {
  volatility: number        // 0 ~ 1
  aiScore: number           // 0 ~ 100

  /**
   * 🔥 whaleIntensity SSOT = 0~100
   *
   * confidence / strength / probability 체계는 기존대로 0~1 유지.
   * whaleIntensity만 앱 전체에서 0~100 기준으로 통일합니다.
   */
  whaleIntensity: number

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

  /**
   * 🔥 whaleIntensity SSOT = 0~100
   *
   * riskIndex 계산은 기존 0~1 normalized 체계를 유지해야 하므로
   * 내부 composite 계산에서만 /100 normalize합니다.
   */
  const normalizedWhaleIntensity =
    Math.max(
      0,
      Math.min(100, whaleIntensity),
    ) / 100

  /* =========================
     1️⃣ Hard Stop (결합 조건만 허용)
     - 단독 EXTREME 금지
     - 기존 0.7 → 70 기준
  ========================= */

  if (
    extremeSignal &&
    volatility > 0.6 &&
    whaleIntensity > 70
  ) {
    return 'EXTREME'
  }

  /*
   * 기존 0.65 → 65 기준.
   * funding 단독/whale 단독 EXTREME 방지를 위해
   * 기존 결합 조건 구조는 그대로 유지합니다.
   */
  if (
    Math.abs(fundingRate) > 0.06 &&
    volatility > 0.5 &&
    whaleIntensity > 65
  ) {
    return 'EXTREME'
  }

  /* =========================
     2️⃣ Composite Risk Index
     - whaleIntensity 가중치 제한
     - 기존 Math.min(whaleIntensity, 0.8)는
       0~100 SSOT 기준에서 normalize 후 0.8 cap 적용
  ========================= */

  const riskIndex =
    volatility * 0.5 +
    Math.min(normalizedWhaleIntensity, 0.8) * 0.25 +
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
     - 기존 0.85 → 85 기준
  ========================= */

  if (
    whaleIntensity > 85 &&
    volatility > 0.35
  ) {
    if (baseRisk === 'MEDIUM') return 'HIGH'
    if (baseRisk === 'HIGH') return 'EXTREME'
  }

  return baseRisk
}
