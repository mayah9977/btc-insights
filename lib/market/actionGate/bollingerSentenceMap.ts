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
  description: string
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
    summary: 'Upper band contact section',
    description:
      'Short 물량이 쌓이기 시작하며, OI/Funding rate가 함께 증가하며, sopr>1 유지와 함께 고래의 분할 매도가 시작되므로, 가격이 급상승 할수도 있지만, 반대로 하락가능성도 높기 때문에 기존에 가지고 있던 포지션의 물량을 줄이는것을 추천합니다.',
    tendency:
      '변동성이 높아질것으로 예상됩니다.',
  },

  [BollingerSignalType.INSIDE_UPPER_CLOSE_ABOVE]: {
    summary: 'Upper band close breakout section',
    description:
      'Whale Exchange Inflow 증가되며, 과열 초입으로 Short 강제청산 발생과 OI/Funding rate가 상승하므로 단기진입은 허용되는구간이나, 갑작스러운 가격 급락이 있을수 있으니 주의하시길바랍니다.',
    tendency:
      '변동성이 높아질것으로 예상됩니다.',
  },

  [BollingerSignalType.INSIDE_UPPER_BREAK_AND_DEVIATE]: {
    summary: 'Upper band deviation maintenance section',
    description:
      '추세 말기 가능성이 있는 과열구간으로 거래량의 둔화가 시작되며, 고래 차익실현 시작과 함께 Funding rate 과열로 상승하던 가격이 급락이 있을수 있으니 주의하시길 바랍니다.',
    tendency:
      '변동성이 높아질것으로 예상됩니다.',
  },

  [BollingerSignalType.OUTSIDE_UPPER_RETRACE_OVER_UPPER]: {
    summary: 'Upper band outside retrace section',
    description:
      '상단 피로 누적으로 추세 둔화가 발생하며, OI/Funding rate/거래량이 감소되며 Long 일부 청산이 있으므로 가격이 급상승 할수도 있지만, 반대로 하락가능성도 높기 때문에 관망하는것을 추천합니다.',
    tendency:
      '변동성이 높아질것으로 예상됩니다.',
  },

  [BollingerSignalType.OUTSIDE_UPPER_RETURN_INSIDE]: {
    summary: 'Upper band re-entry section',
    description:
      '시장 과열이 종료되고 변동성 감소 시작으로, OI가 감소, Funding rate가 정상화, Short 물량증가가 발생하고 있으므로, 관망하는것을 추천합니다.',
    tendency:
      '변동성이 높아질것으로 예상됩니다.',
  },

  /* =======================================================================
   * Lower Band (6 ~ 11)
   * ======================================================================= */

  [BollingerSignalType.INSIDE_LOWER_TOUCH_OR_BREAK]: {
    summary: 'Lower band contact section',
    description:
      'OI/Funding rate가 급감하며, Long liquidation 발생으로 Whale Exchange Inflow 증가로 변동성 폭발하며 초기 위험구간으로 진입하므로 주의하시길 바랍니다.',
    tendency:
      '변동성이 높아질것으로 예상됩니다.',
  },

  [BollingerSignalType.INSIDE_LOWER_TOUCH_AND_REBOUND]: {
    summary: 'Lower band rebound attempt section',
    description:
      'OI 감소후 안정/ Funding rate 음수 과도 / 거래량 감소로 인한 Whale 매집이 시작되는 구간으로 안정구간 진입 가능성이 있으나 변동성은 남아있으니 포지션은 분할로 진입하는것을 추천합니다.',
    tendency:
      '시장이 안정구간으로 진입이 예상됩니다.',
  },

  [BollingerSignalType.INSIDE_LOWER_CLOSE_BELOW]: {
    summary: 'Lower band close breakout section',
    description:
      'OI 급감/ Funding rate 음수 심화/ Whale 매집 대기, Long 청산으로 인한 추세 가속하락이 있을수 있으니, 관망하는것을 추천합니다.',
    tendency:
      '변동성이 높아질것으로 예상됩니다.',
  },

  [BollingerSignalType.INSIDE_LOWER_BREAK_AND_DEVIATE]: {
    summary: 'Lower band deviation maintenance section',
    description:
      'OI 바닥 근처/ Funding rate 극단 음수/ 거래량 감소와 Whale 대량 매집으로인한 과도한 공포 구간으로, 관망하면서 가격 반등을 준비하는것을 추천합니다.)',
    tendency:
      '변동성이 높아진것으로 판단됩니다.',
  },

  [BollingerSignalType.OUTSIDE_LOWER_CROSS_UP_OVER_LOWER]: {
    summary: 'Lower band upward cross section',
    description:
      'OI 반등/Funding rate 정상화/거래량 상승과 Whale 매집후 상승, Short 강제청산 발생으로 하락하던 가격이 상승전환될 가능성 있으므로, 포지션 진입은 가능하나, 아직 변동성이 남아있으니 주의하시길 바랍니다.)',
    tendency:
      '변동성이 높아질것으로 예상됩니다.',
  },

  [BollingerSignalType.OUTSIDE_LOWER_RETURN_INSIDE]: {
    summary: 'Lower band re-entry section',
    description:
      'OI 안정/ Funding rate 완화/ 거래량감소로 시장이 안정구간에 진입할것으로 예상되므로, 포지션 진입은 가능하나 아직 변동성이 높으니 포지션 분할진입을 추천합니다.)',
    tendency:
      '시장이 안정구간으로 진입이 예상됩니다.',
  },

  /* =======================================================================
   * Inside Center (12)
   * ======================================================================= */

  [BollingerSignalType.INSIDE_CENTER]: {
    summary: 'Band internal neutral section',
    description:
      'OI 정체 / Funding rate 중립 / 거래량 감소 / NUPL이 안정권에 들어오면서 시장의 에너지 축적으로 인한 횡보구간이므로, 무리한 포지션진입보다는 더 좋은 자리를 기다리는것을 추천합니다. ( 최고의 매매는 잃지 않는 매매입니다. )' ,
    tendency:
      '횡보 구간으로 판단됩니다.',
  },
}
