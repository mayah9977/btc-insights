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
      '상단 밴드 인근에서 시장 낙관 심리가 확산되는 흐름입니다.',
      '상단 밴드 근처에서 시장 추격 매수 심리가 나타나고 있습니다.',
      '상단 구간에서 낙관적 심리와 함께 추세 추격 움직임이 감지됩니다.',
    ],
    tendency:
      'Keyword : 낙관 추격 FOMO 경계 (Optimism chase Beware of FOMO)',
  },

  [BollingerSignalType.INSIDE_UPPER_CLOSE_ABOVE]: {
    summary: 'Finalized Data Analysis  ( 확정된 분석 )',
    description: [
      '상단 밴드 돌파 이후 시장 과열 초기 신호가 나타나고 있습니다.',
      '상단 돌파 이후 단기 과열 흐름이 형성되고 있습니다.',
      '추세 상단 돌파와 함께 시장 과열 신호가 감지됩니다.',
    ],
    tendency:
      'Keyword : 탐욕 확산 과열 진입 (Greed spreads and overheats)',
  },

  [BollingerSignalType.INSIDE_UPPER_BREAK_AND_DEVIATE]: {
    summary: 'Finalized Data Analysis  ( 확정된 분석 )',
    description: [
      '상단 밴드 이탈 이후 과열 확장 구간이 형성되고 있습니다.',
      '추세 과열 구간에서 변동성이 확대되는 흐름입니다.',
      '추세 말기 가능성이 있는 과열 확장 구간입니다.',
    ],
    tendency:
      'Keyword : 과열 극단 차익실현 경계 (Caution against overheating and extreme profit-taking)',
  },

  [BollingerSignalType.OUTSIDE_UPPER_RETRACE_OVER_UPPER]: {
    summary: 'Finalized Data Analysis  ( 확정된 분석 )',
    description: [
      '상단 과열 이후 추세 피로 신호가 감지되고 있습니다.',
      '상단 구간에서 추세 둔화 가능성이 나타나고 있습니다.',
      '상단 영역에서 시장 에너지 소모가 나타나는 흐름입니다.',
    ],
    tendency:
      'Keyword : 추세 둔화 리스크 확대 (Risk of trend deceleration intensifies)',
  },

  [BollingerSignalType.OUTSIDE_UPPER_RETURN_INSIDE]: {
    summary: 'Finalized Data Analysis  ( 확정된 분석 )',
    description: [
      '과열 이후 시장 안정 흐름이 형성되고 있습니다.',
      '상단 과열 구간 이후 시장 균형 회복 흐름입니다.',
      '과열 이후 변동성 안정 구간으로 진입하는 흐름입니다.',
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
      '하단 밴드 인근에서 시장 공포 심리가 확대되고 있습니다.',
      '하단 구간에서 변동성 확대와 함께 공포 흐름이 나타나고 있습니다.',
      '시장 하락 압력이 강해지는 공포 구간입니다.',
    ],
    tendency:
      'Keyword : 공포 확산 청산 가속 (Accelerating the elimination of fear propagation)',
  },

  [BollingerSignalType.INSIDE_LOWER_TOUCH_AND_REBOUND]: {
    summary: 'Finalized Data Analysis  ( 확정된 분석 )',
    description: [
      '하단 밴드 부근에서 반등 시도가 나타나고 있습니다.',
      '하단 영역에서 시장 안정 신호가 감지되고 있습니다.',
      '하락 이후 반등 가능성이 형성되는 구간입니다.',
    ],
    tendency:
      'Keyword : 매집 시작 반등 시도 (Accumulation phase begins, attempting a rebound)',
  },

  [BollingerSignalType.INSIDE_LOWER_CLOSE_BELOW]: {
    summary: 'Finalized Data Analysis  ( 확정된 분석 )',
    description: [
      '하단 밴드 하향 이탈과 함께 하락 압력이 강화되고 있습니다.',
      '시장 공포 구간에서 하락 추세가 강화되는 흐름입니다.',
      '하락 추세 가속 가능성이 나타나는 구간입니다.',
    ],
    tendency:
      'Keyword : 하락 가속 관망 우선 (Accelerating decline; wait-and-see approach first)',
  },

  [BollingerSignalType.INSIDE_LOWER_BREAK_AND_DEVIATE]: {
    summary: 'Finalized Data Analysis  ( 확정된 분석 )',
    description: [
      '하단 밴드 이탈 이후 극단 공포 구간이 형성되었습니다.',
      '시장 극단 공포 영역에서 변동성이 확대되고 있습니다.',
      '하락 과도 구간에서 반등 준비 가능성이 나타날 수 있습니다.',
    ],
    tendency:
      'Keyword : 극단 공포 바닥 준비 (Preparing for the Bottom of Extreme Fear)',
  },

  [BollingerSignalType.OUTSIDE_LOWER_CROSS_UP_OVER_LOWER]: {
    summary: 'Finalized Data Analysis  ( 확정된 분석 )',
    description: [
      '하단 이탈 이후 반등 전환 신호가 감지됩니다.',
      '하락 이후 시장 반등 흐름이 나타나고 있습니다.',
      '추세 반전 가능성이 나타나는 구간입니다.',
    ],
    tendency:
      'Keyword : 반등 전환 숏청산 발생 (Short liquidation triggered by rebound reversal)',
  },

  [BollingerSignalType.OUTSIDE_LOWER_RETURN_INSIDE]: {
    summary: 'Finalized Data Analysis  ( 확정된 분석 )',
    description: [
      '하단 과도 구간 이후 시장 안정 흐름이 형성되고 있습니다.',
      '시장 균형 회복 구간으로 진입하는 흐름입니다.',
      '변동성 축소와 함께 안정 구간이 형성되고 있습니다.',
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
      '시장 에너지 축적 구간으로 횡보 흐름이 형성되고 있습니다.',
      'OI 및 Funding 정체 흐름 속에서 방향성 대기 구간이 나타나고 있습니다.',
      '거래량 감소와 함께 시장 균형 상태에서 에너지 축적이 진행되고 있습니다.',
      '추세 중립 구간에서 시장 참여자들이 방향성을 탐색하는 흐름입니다.',
    ],
    tendency:
      'Keyword : 횡보 대기 에너지 축적 (Sideways movement energy accumulation)',
  },
}
