import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

/* =========================================================
Market Regime Type
========================================================= */

export type MarketRegime =
  | 'TREND'
  | 'RANGE'
  | 'VOLATILE'
  | 'UNKNOWN'

/* =========================================================
Market Regime Signal
========================================================= */

export interface MarketRegimeSignal {
  regimeSignals: string[]
}

/* =========================================================
ActionGateState → MarketRegime Mapping
========================================================= */

function mapActionGateToRegime(
  state?: 'OBSERVE' | 'CAUTION' | 'IGNORE'
): MarketRegime {

  if (state === 'IGNORE') return 'VOLATILE'
  if (state === 'CAUTION') return 'TREND'
  if (state === 'OBSERVE') return 'RANGE'

  return 'UNKNOWN'
}

/* =========================================================
Interpret Market Regime
========================================================= */

export function interpretMarketRegime(): MarketRegimeSignal {

  const market = useVIPMarketStore.getState()

  const regimeSignals: string[] = []

  const regime = mapActionGateToRegime(market.actionGateState)

  /* =========================================================
  TREND Market
  ========================================================= */

  if (regime === 'TREND') {
    regimeSignals.push(
      '시장 추세 전환 흐름이 형성되며 방향성이 강화되고'
    )
  }

  /* =========================================================
  RANGE Market
  ========================================================= */

  if (regime === 'RANGE') {
    regimeSignals.push(
      '박스권 구간에서 방향성이 제한되는 흐름이 형성되고'
    )
  }

  /* =========================================================
  VOLATILE Market
  ========================================================= */

  if (regime === 'VOLATILE') {
    regimeSignals.push(
      '시장 변동성이 확대되는 흐름이 나타나며 급격한 가격 움직임이 동반되고'
    )
  }

  /* =========================================================
  UNKNOWN Market
  ========================================================= */

  if (regime === 'UNKNOWN') {
    regimeSignals.push(
      '시장 구조가 명확하지 않은 상태에서 방향성 탐색 흐름이 이어지고'
    )
  }

  return {
    regimeSignals,
  }
}
