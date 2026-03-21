/* =========================================================
  Market Regime Interpreter (Final - ActionGate Sync 안정화)
========================================================= */

import { MarketSnapshot } from '@/lib/market/engine/marketSnapshot'
import { RegimeSignal } from '@/lib/market/types/signalTypes'

/* 🔥 추가 (store 직접 참조) */
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
  ActionGateState → MarketRegime Mapping
========================================================= */
function mapActionGateToRegime(
  state?: 'OBSERVE' | 'CAUTION' | 'IGNORE',
): MarketRegime {
  if (state === 'IGNORE') return 'VOLATILE'
  if (state === 'CAUTION') return 'TREND'
  if (state === 'OBSERVE') return 'RANGE'
  return 'UNKNOWN'
}

/* =========================================================
  Interpret Market Regime (Final)
  🔥 snapshot 의 stale 값 방지 → store 기준 우선 사용
========================================================= */
export function interpretMarketRegime(
  snapshot: MarketSnapshot,
): { regimeSignals: RegimeSignal[] } {
  const regimeSignals: RegimeSignal[] = []

  /* 🔥 핵심 FIX: snapshot 대신 store 우선 */
  const storeState =
    useVIPMarketStore.getState().actionGateState

  const actionGateState =
    storeState ?? snapshot.actionGateState

  const regime = mapActionGateToRegime(actionGateState)

  /* =========================================================
    TREND
  ========================================================= */
  if (regime === 'TREND') {
    regimeSignals.push({
      type: 'TREND',
      category: 'regime',
      strength: 1,
    })
  }

  /* =========================================================
    RANGE
  ========================================================= */
  if (regime === 'RANGE') {
    regimeSignals.push({
      type: 'RANGE',
      category: 'regime',
      strength: 0.5,
    })
  }

  /* =========================================================
    VOLATILE
  ========================================================= */
  if (regime === 'VOLATILE') {
    regimeSignals.push({
      type: 'VOLATILE',
      category: 'regime',
      strength: 1.2,
    })
  }

  /* =========================================================
    UNKNOWN
  ========================================================= */
  if (regime === 'UNKNOWN') {
    regimeSignals.push({
      type: 'UNKNOWN',
      category: 'regime',
      strength: 0.3,
    })
  }

  return {
    regimeSignals,
  }
}
