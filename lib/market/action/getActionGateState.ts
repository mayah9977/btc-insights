// lib/market/action/getActionGateState.ts

/**
 * 최종 행동 게이트 상태
 * - OBSERVE : 구조적 해석 가능
 * - CAUTION : 해석은 가능하나 사고 제한 필요
 * - IGNORE  : 해석 자체 금지
 */
export type ActionGateState =
  | 'OBSERVE'
  | 'CAUTION'
  | 'IGNORE'

/**
 * 각 관측 필터의 결과를 그대로 전달받는다
 * (이 파일은 계산을 하지 않는다. 오직 결합만 한다)
 */
type ActionGateInput = {
  // 최상위 행동 데이터
  whalePressure: 'NORMAL' | 'ELEVATED' | 'EXTREME'
  participationState: 'HEALTHY' | 'WEAKENING' | 'COLLAPSED' // OI / Volume / Funding 종합 상태

  // Observation Filters
  bollingerRegime: 'EXPANDED' | 'COMPRESSING' | 'NEUTRAL'
  elliott: { possible: boolean }
  trend: { valid: boolean }
  fibonacci: { overextended: boolean }
  momentum: { valid: boolean }
}

/**
 * Action Gate
 * ❌ 매수 / 매도
 * ❌ 방향
 * ❌ 타이밍
 * ❌ RiskEngine 개입
 * ✅ 오직 해석 허용 상태만 판단
 */
export function getActionGateState(
  input: ActionGateInput
): ActionGateState {
  const {
    whalePressure,
    participationState,
    bollingerRegime,
    elliott,
    trend,
    fibonacci,
    momentum
  } = input

  /**
   * 1️⃣ 즉시 IGNORE 조건
   * 구조 언어 사용 자체가 불가능한 상태
   */

  // 대자본이 극단적으로 구조를 왜곡
  if (whalePressure === 'EXTREME') {
    return 'IGNORE'
  }

  // 참여 구조 붕괴 (OI / Volume / Funding)
  if (participationState === 'COLLAPSED') {
    return 'IGNORE'
  }

  // 파동 언어 자체 사용 불가
  if (!elliott.possible) {
    return 'IGNORE'
  }

  /**
   * 기본 상태는 OBSERVE
   */
  let state: ActionGateState = 'OBSERVE'

  /**
   * 2️⃣ CAUTION 전이 조건
   * 해석은 가능하나 사고 제한 필요
   */

  // 추세 사고 불가
  if (!trend.valid) {
    state = 'CAUTION'
  }

  // 변동성 이미 소모
  if (bollingerRegime === 'EXPANDED') {
    state = 'CAUTION'
  }

  // 구조 과장
  if (fibonacci.overextended) {
    state = 'CAUTION'
  }

  // 구조적 설득력 붕괴
  if (!momentum.valid) {
    state = 'CAUTION'
  }

  /**
   * COMPRESSING은 경고지만 차단은 아님
   * (압력 누적 상태)
   */
  if (bollingerRegime === 'COMPRESSING') {
    state = 'CAUTION'
  }

  return state
}
