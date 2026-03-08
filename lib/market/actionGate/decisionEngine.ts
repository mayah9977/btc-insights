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
   🧠 Final Decision ENUM (SSOT)
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
   🎯 Decision Engine (Public API)
========================================================= */

export interface DecisionEngineInput {
  symbol: string
  actionGateState: ActionGateState
  bollingerSignal: BollingerSignalType | null
  macd: MACDResult | null
  probability: DirectionalProbabilityResult
  fmai: FMAIResult | null
}

/* ========================================================= */

export function evaluateDecisionEngine(
  input: DecisionEngineInput
): FinalDecision {

  const {
    symbol,
    actionGateState,
    bollingerSignal,
    macd,
    probability,
    fmai,
  } = input

  return evaluatePriorityDecisionTree({
    symbol,
    actionGateState,
    bollingerSignal,
    macd,
    probability,
    fmai,
  })
}
