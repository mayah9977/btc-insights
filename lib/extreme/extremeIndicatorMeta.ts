export type ExtremeIndicatorKey =
  | 'WHALE_ACTIVITY'
  | 'LIQUIDITY_SPIKE'
  | 'VOLATILITY_BURST';

export const EXTREME_META: Record<
  ExtremeIndicatorKey,
  { title: string; description: string }
> = {
  WHALE_ACTIVITY: {
    title: '대규모 거래 활동',
    description:
      '일정 규모 이상의 거래가 감지된 경우를 시각화한 지표입니다.',
  },
  LIQUIDITY_SPIKE: {
    title: '유동성 변화',
    description:
      '시장 유동성이 급격히 변하는 구간을 감지합니다.',
  },
  VOLATILITY_BURST: {
    title: '변동성 증가',
    description:
      '단기간 내 가격 변동성이 확대된 상태를 나타냅니다.',
  },
};
