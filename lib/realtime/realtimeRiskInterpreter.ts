import type { RiskLevel } from '@/lib/vip/riskTypes'

/* =========================
 * Types (SSOT 기준)
 * ========================= */

export type InterpretedRiskState = {
  message: string
  confidenceScore: number
  pressureTrend: 'UP' | 'DOWN' | 'STABLE'
  extremeProximity: number
  preExtreme: boolean
  hint: string
  whaleAccelerated: boolean
}

type InterpretInput = {
  riskLevel: RiskLevel
  prevRiskLevel?: RiskLevel | null
  whaleIntensity?: number
  avgWhale?: number
  whaleTrend?: 'UP' | 'DOWN' | 'FLAT'
  isSpike?: boolean
}

/* =========================
 * Helpers
 * ========================= */

const RISK_ORDER: RiskLevel[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'EXTREME',
]

function compareRisk(
  prev?: RiskLevel | null,
  next?: RiskLevel,
): 'UP' | 'DOWN' | 'STABLE' {
  if (!prev || !next) return 'STABLE'

  const p = RISK_ORDER.indexOf(prev)
  const n = RISK_ORDER.indexOf(next)

  if (n > p) return 'UP'
  if (n < p) return 'DOWN'
  return 'STABLE'
}

/* =========================
 * Core Interpreter
 * ========================= */

export function interpretRealtimeRisk(
  input: InterpretInput,
): InterpretedRiskState {
  const {
    riskLevel,
    prevRiskLevel,
    whaleIntensity = 0,
    avgWhale = 0,
    whaleTrend = 'FLAT',
    isSpike = false,
  } = input

  /* 1️⃣ Risk 방향 */
  const riskDirection = compareRisk(
    prevRiskLevel,
    riskLevel,
  )

  /* 2️⃣ 압력 방향 */
  const pressureTrend: 'UP' | 'DOWN' | 'STABLE' =
    whaleTrend === 'UP' || riskDirection === 'UP'
      ? 'UP'
      : whaleTrend === 'DOWN' || riskDirection === 'DOWN'
      ? 'DOWN'
      : 'STABLE'

  /* =====================================================
   * 3️⃣ 🔥 Extreme Proximity (완화 + 다이나믹 강화)
   * ===================================================== */

  let extremeProximity = 0

  // 기본 단계 완화
  if (riskLevel === 'LOW') extremeProximity = 0.18
  if (riskLevel === 'MEDIUM') extremeProximity = 0.42
  if (riskLevel === 'HIGH') extremeProximity = 0.72
  if (riskLevel === 'EXTREME') extremeProximity = 1

  // 🔥 whaleIntensity 비선형 가중
  // 0~1 스케일이라고 가정
  const whaleBoost = Math.pow(whaleIntensity, 1.2) * 0.18

  extremeProximity += whaleBoost

  // spike 보정 완화
  if (isSpike) extremeProximity += 0.12

  // HIGH 단계는 상승 압력일 때 더 빠르게 근접
  if (riskLevel === 'HIGH' && pressureTrend === 'UP') {
    extremeProximity += 0.05
  }

  extremeProximity = Math.min(1, extremeProximity)

  /* =====================================================
   * 4️⃣ Pre-Extreme 완화
   * ===================================================== */

  const preExtreme =
    riskLevel === 'HIGH' &&
    extremeProximity >= 0.78 &&
    pressureTrend !== 'DOWN'

  /* =====================================================
   * 5️⃣ UI Hint
   * ===================================================== */

  let hint = '시장 안정'

  if (riskLevel === 'MEDIUM') {
    hint =
      pressureTrend === 'UP'
        ? '변동성 확대 중'
        : '변동성 완화 중'
  }

  if (riskLevel === 'HIGH') {
    hint =
      pressureTrend === 'UP'
        ? 'EXTREME 가능성 증가'
        : '고위험 구간 유지'
  }

  if (preExtreme) {
    hint = '🔥 EXTREME 진입 직전'
  }

  if (riskLevel === 'EXTREME') {
    hint = '⚠ 극단적 위험 상태'
  }

  /* =====================================================
   * 6️⃣ Whale 가속 (완화)
   * ===================================================== */

  const whaleAccelerated =
    whaleIntensity > avgWhale * 1.15 ||
    (isSpike && whaleIntensity > 0.45)

  /* =====================================================
   * 7️⃣ 전략형 메시지
   * ===================================================== */

  let message =
    '시장 흐름이 안정적이며 체결·추세 모두 균형 상태입니다. 전략 기반 진입이 가능한 구간입니다.'

  if (riskLevel === 'MEDIUM') {
    message =
      '변동성이 점진적으로 확대되고 있습니다. 무리한 진입보다는 조건부·분할 접근이 적합합니다.'
  }

  if (riskLevel === 'HIGH') {
    message =
      '고래 체결 집중과 변동성 확대로 고위험 구간에 진입했습니다. 신규 진입은 신중히 판단해야 합니다.'
  }

  if (preExtreme) {
    message =
      '고위험 신호가 누적되며 EXTREME 구간 진입이 임박했습니다. 포지션 축소 또는 관망이 권장됩니다.'
  }

  if (riskLevel === 'EXTREME') {
    message =
      '급격한 방향성 붕괴 가능성이 높은 극단적 위험 상태입니다. 신규 진입을 중단하고 리스크 회피가 필요합니다.'
  }

  /* =====================================================
   * 8️⃣ Confidence (미세 조정)
   * ===================================================== */

  const confidenceScore =
    riskLevel === 'LOW'
      ? 0.9
      : riskLevel === 'MEDIUM'
      ? 0.82
      : riskLevel === 'HIGH'
      ? 0.76
      : 0.72

  return {
    message,
    confidenceScore,
    pressureTrend,
    extremeProximity,
    preExtreme,
    hint,
    whaleAccelerated,
  }
}
