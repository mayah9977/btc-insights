/**
 * Action Gate v2
 * Bollinger Signal → Sentence Mapping (SSOT)
 *
 * ⚠️ This file is the “end point of the interpretation language”.
 * - Create judgment ❌
 * - Calculate ❌
 * - Conditional branching ❌
 *
 * Only responsible for signalType → sentence mapping.
 */

import { BollingerSignalType } from './signalType'

/* -----------------------------
 * Action Gate Sentence Shape
 * ----------------------------- */

export interface ActionGateSentence {
  summary: string
  description: string[]
  tendency: string
}

/* -----------------------------
 * 🔒 Bollinger Sentence Map (SSOT)
 * ----------------------------- */

export const BOLLINGER_SENTENCE_MAP: Record<
  BollingerSignalType,
  ActionGateSentence
> = {

  /* =======================================================================
   * Upper Band (1 ~ 5)
   * ======================================================================= */

  [BollingerSignalType.INSIDE_UPPER_TOUCH]: {
    summary: 'Finalized Data Analysis  ( 확정된 분석 )',
    description: [
      '고래의 분할 매도가 시작될수있으므로, 포지션을 줄이는것을 추천합니다.',
    ],
    tendency:
      'Keyword : 낙관 추격 FOMO 경계 (Optimism chase Beware of FOMO)',
  },

  [BollingerSignalType.INSIDE_UPPER_CLOSE_ABOVE]: {
    summary: 'Finalized Data Analysis  ( 확정된 분석 )',
    description: [
      '단기진입은 허용되는구간이나, 가격 급락이 있을수 있으니 주의하시길바랍니다.',
    ],
    tendency:
      'Keyword : 탐욕 확산 과열 진입 (Greed spreads and overheats)',
  },

  [BollingerSignalType.INSIDE_UPPER_BREAK_AND_DEVIATE]: {
    summary: 'Finalized Data Analysis  ( 확정된 분석 )',
    description: [
      '고래 차익실현으로 상승하던 가격이 급락이 있을수 있으니 주의하시길바랍니다.',
    ],
    tendency:
      'Keyword : 과열 극단 차익실현 경계 (Caution against overheating and extreme profit-taking)',
  },

  [BollingerSignalType.OUTSIDE_UPPER_RETRACE_OVER_UPPER]: {
    summary: 'Finalized Data Analysis  ( 확정된 분석 )',
    description: [
      '가격이 상단 피로 누적으로 추세 둔화가 발생할수 있으므로, 관망하는것을 추천합니다.',
    ],
    tendency:
      'Keyword : 추세 둔화 리스크 확대 (Risk of trend deceleration intensifies)',
  },

  [BollingerSignalType.OUTSIDE_UPPER_RETURN_INSIDE]: {
    summary: 'Finalized Data Analysis  ( 확정된 분석 )',
    description: [
      '시장 과열이 종료되고 변동성 감소 시작이 있을수 있으므로, 관망하는것을 추천합니다.',
    ],
    tendency:
      'Keyword : 과열 해소 변동성 축소 (Overheating resolution and volatility reduction)',
  },

  /* =======================================================================
   * Lower Band (6 ~ 11)
   * ======================================================================= */

  [BollingerSignalType.INSIDE_LOWER_TOUCH_OR_BREAK]: {
    summary: 'Finalized Data Analysis  ( 확정된 분석 )',
    description: [
      '위험구간으로 진입할수 있으므로 주의하시길 바랍니다.',
    ],
    tendency:
      'Keyword : 공포 확산 청산 가속 (Accelerating the elimination of fear propagation)',
  },

  [BollingerSignalType.INSIDE_LOWER_TOUCH_AND_REBOUND]: {
    summary: 'Finalized Data Analysis  ( 확정된 분석 )',
    description: [
      '안정구간으로 진입 가능성이 있으나 변동성은 남아있으니 포지션은 분할로 진입하는것을 추천합니다.',
    ],
    tendency:
      'Keyword : 매집 시작 반등 시도 (Accumulation phase begins, attempting a rebound)',
  },

  [BollingerSignalType.INSIDE_LOWER_CLOSE_BELOW]: {
    summary: 'Finalized Data Analysis  ( 확정된 분석 )',
    description: [
      '추세 가속하락이 있을수 있으니, 관망하는것을 추천합니다.',
    ],
    tendency:
      'Keyword : 하락 가속 관망 우선 (Accelerating decline; wait-and-see approach first)',
  },

  [BollingerSignalType.INSIDE_LOWER_BREAK_AND_DEVIATE]: {
    summary: 'Finalized Data Analysis  ( 확정된 분석 )',
    description: [
      '과도한 공포 구간으로, 관망하면서 가격 반등을 준비하는것을 추천합니다.',
    ],
    tendency:
      'Keyword : 극단 공포 바닥 준비 (Preparing for the Bottom of Extreme Fear)',
  },

  [BollingerSignalType.OUTSIDE_LOWER_CROSS_UP_OVER_LOWER]: {
    summary: 'Finalized Data Analysis  ( 확정된 분석 )',
    description: [
      '포지션 진입은 가능하나, 아직 변동성이 남아있으니 주의하시길 바랍니다.',
    ],
    tendency:
      'Keyword : 반등 전환 숏청산 발생 (Short liquidation triggered by rebound reversal)',
  },

  [BollingerSignalType.OUTSIDE_LOWER_RETURN_INSIDE]: {
    summary: 'Finalized Data Analysis  ( 확정된 분석 )',
    description: [
      '포지션 진입은 가능하나 변동성이 높으니 포지션 분할진입을 추천합니다.',
    ],
    tendency:
      'Keyword : 안정 회복 분할 진입 (Stable Recovery Phased Entry)',
  },

  /* =======================================================================
   * Center Band (12)
   * ======================================================================= */

  [BollingerSignalType.INSIDE_CENTER]: {
    summary: 'Finalized Data Analysis  ( 확정된 분석 )',
    description: [
      '무리한 포지션진입보다는 더 좋은 자리를 기다리는것을 추천합니다.',
    ],
    tendency:
      'Keyword : 횡보 대기 에너지 축적 (Sideways movement energy accumulation)',
  },
}
