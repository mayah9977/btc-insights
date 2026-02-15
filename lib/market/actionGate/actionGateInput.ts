/**
 * ActionGateInput (SSOT)
 *
 * 목적:
 * - buildRiskInputFromRealtime
 * - getActionGateState
 *
 * 두 계층이 **동일한 입력 계약**을 사용하도록 강제
 *
 * 원칙:
 * - ❌ 계산 로직 없음
 * - ❌ 문장 / 판단 / 추천 없음
 * - ⭕ 관측 결과만 포함
 */

/* =====================================================
 * Bollinger Observation
 * ===================================================== */
export type BollingerRegime =
  | 'COMPRESSING'
  | 'EXPANDED'
  | 'NEUTRAL'

export type BollingerStructure =
  | 'UPPER'
  | 'LOWER'
  | 'INSIDE'

/* =====================================================
 * Action Gate Input (SSOT)
 * ===================================================== */
export interface ActionGateInput {
  /* -----------------------------
   * Market Pressure
   * ----------------------------- */
  whalePressure: 'NORMAL' | 'ELEVATED' | 'EXTREME'

  participationState:
    | 'HEALTHY'
    | 'WEAKENING'
    | 'COLLAPSED'

  /* -----------------------------
   * Bollinger Observation
   * ----------------------------- */
  bollingerRegime: BollingerRegime
  bollingerStructure?: BollingerStructure

  /* -----------------------------
   * Structural Filters
   * ----------------------------- */
  elliott: {
    possible: boolean
  }

  trend: {
    valid: boolean
  }

  fibonacci: {
    overextended: boolean
  }

  momentum: {
    valid: boolean
  }
}
