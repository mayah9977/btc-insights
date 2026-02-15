import { BollingerSignalType } from './signalType'

/**
 * Bollinger Observation (Action Gate v2)
 *
 * 역할:
 * - BollingerSignalType(enum)를
 *   Action Gate가 소비 가능한 "관측 상태"로 변환
 *
 * 원칙:
 * - ❌ 문장 생성
 * - ❌ 판단 / 추천
 * - ❌ 조건 분기 로직 확장
 * - ⭕ 구조적 상태만 반환
 */

/* --------------------------------
 * Observation Output Shape
 * -------------------------------- */
export type BollingerObservation = {
  bollingerRegime: 'COMPRESSING' | 'EXPANDED' | 'NEUTRAL'
  bollingerStructure: 'UPPER' | 'LOWER' | 'INSIDE'
}

/* --------------------------------
 * Core Derivation
 * -------------------------------- */
export function deriveBollingerObservation(
  signalType: BollingerSignalType,
): BollingerObservation {
  switch (signalType) {

    /* =====================================================
     * Upper Band Structures (1 ~ 5)
     * ===================================================== */

    case BollingerSignalType.INSIDE_UPPER_TOUCH:
      return {
        bollingerRegime: 'NEUTRAL',
        bollingerStructure: 'UPPER',
      }

    case BollingerSignalType.INSIDE_UPPER_CLOSE_ABOVE:
    case BollingerSignalType.INSIDE_UPPER_BREAK_AND_DEVIATE:
    case BollingerSignalType.OUTSIDE_UPPER_RETRACE_OVER_UPPER:
      return {
        bollingerRegime: 'EXPANDED',
        bollingerStructure: 'UPPER',
      }

    case BollingerSignalType.OUTSIDE_UPPER_RETURN_INSIDE:
      return {
        bollingerRegime: 'NEUTRAL',
        bollingerStructure: 'INSIDE',
      }

    /* =====================================================
     * Lower Band Structures (6 ~ 11)
     * ===================================================== */

    case BollingerSignalType.INSIDE_LOWER_TOUCH_OR_BREAK:
      return {
        bollingerRegime: 'NEUTRAL',
        bollingerStructure: 'LOWER',
      }

    case BollingerSignalType.INSIDE_LOWER_CLOSE_BELOW:
    case BollingerSignalType.INSIDE_LOWER_BREAK_AND_DEVIATE:
      return {
        bollingerRegime: 'EXPANDED',
        bollingerStructure: 'LOWER',
      }

    case BollingerSignalType.INSIDE_LOWER_TOUCH_AND_REBOUND:
    case BollingerSignalType.OUTSIDE_LOWER_CROSS_UP_OVER_LOWER:
    case BollingerSignalType.OUTSIDE_LOWER_RETURN_INSIDE:
      return {
        bollingerRegime: 'NEUTRAL',
        bollingerStructure: 'INSIDE',
      }

    /* =====================================================
     * Center (12)
     * ===================================================== */

    case BollingerSignalType.INSIDE_CENTER:
      return {
        bollingerRegime: 'NEUTRAL',
        bollingerStructure: 'INSIDE',
      }

    /* =====================================================
     * Safety fallback
     * ===================================================== */

    default:
      return {
        bollingerRegime: 'NEUTRAL',
        bollingerStructure: 'INSIDE',
      }
  }
}
