import { VipMarketState } from './vipJudgementEngine'

export function generateVipSentence(state: VipMarketState) {
  switch (state) {
    case 'SAFE':
      return '시장 구조가 안정적이며 추세의 연속성이 유지되고 있습니다. 통계적으로 추세 추종 전략이 유리한 구간입니다.'

    case 'CAUTION':
      return '추세 신뢰도가 약화되고 있으며 단기 변동성 노출 가능성이 있습니다. 포지션 규모를 줄이거나 분할 접근이 권장됩니다.'

    case 'DANGER':
      return '변동성과 고래 자금 흐름이 동시에 확대되고 있습니다. 신규 진입은 리스크 대비 기대값이 낮은 구간입니다.'

    case 'OVERHEAT':
      return '시장 과열 상태로 판단됩니다. 과거 통계 기준 신규 진입 성공률이 급격히 저하되는 구간입니다.'
  }
}
