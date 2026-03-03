/* =========================================================
   🎯 Decision Engine (Wrapper)
   - 실제 판단은 Priority Tree에서 수행
========================================================= */

import type { ActionGateState } from '@/components/system/ActionGateStatus'
import type { MACDResult } from '@/lib/market/macd'
import type { DirectionalProbabilityResult } from '@/lib/market/institutionalProbability'
import type { BollingerSignalType } from '@/lib/market/actionGate/signalType'
import type { FMAIResult } from '@/lib/market/momentum/futuresMomentumAlignment'

import { evaluatePriorityDecisionTree } from './priorityDecisionTree'

/* =========================================================
   12 Enum 정의 (SSOT)
========================================================= */

export type FinalDecision =
  | 'WAIT'
  | 'LONG_ENTRY'
  | 'SHORT_ENTRY'
  | 'HOLD_LONG'
  | 'HOLD_SHORT'
  | 'REDUCE_LONG'
  | 'REDUCE_SHORT'
  | 'TAKE_PROFIT_LONG'
  | 'TAKE_PROFIT_SHORT'
  | 'EXTREME_LONG'
  | 'EXTREME_SHORT'
  | 'BLOCKED_BY_GATE'

/* =========================================================
   🎯 Public Decision Engine
   - Wrapper Only
========================================================= */

export function evaluateDecisionEngine({
  symbol, // 🔥 추가
  actionGateState,
  bollingerSignal,
  macd,
  probability,
  fmai,
}: {
  symbol: string                    // 🔥 추가
  actionGateState: ActionGateState
  bollingerSignal: BollingerSignalType | null
  macd: MACDResult | null
  probability: DirectionalProbabilityResult
  fmai: FMAIResult | null
}): FinalDecision {

  return evaluatePriorityDecisionTree({
    symbol,                         // 🔥 전달
    actionGateState,
    bollingerSignal,
    macd,
    probability,
    fmai,
  })
}
