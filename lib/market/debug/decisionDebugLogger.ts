/* =========================================================
   🧠 Decision Debug Logger
   - Adaptive Weight Decision Engine 상태 출력
========================================================= */

import type { MACDResult } from '@/lib/market/macd'
import type { DirectionalProbabilityResult } from '@/lib/market/institutionalProbability'
import type { FMAIResult } from '@/lib/market/momentum/futuresMomentumAlignment'
import type { BollingerSignalType } from '@/lib/market/actionGate/signalType'
import type { FinalDecision } from '@/lib/market/actionGate/decisionEngine'
import type { ActionGateState } from '@/components/system/ActionGateStatus'

/* ========================================================= */

export function logDecisionDebug({
  symbol,
  bollinger,
  macd,
  fmai,
  probability,
  actionGateState,
  decision,
}: {
  symbol: string
  bollinger: BollingerSignalType | null
  macd: MACDResult | null
  fmai: FMAIResult | null
  probability: DirectionalProbabilityResult
  actionGateState: ActionGateState
  decision: FinalDecision
}) {

  console.log('======================================')
  console.log('[DECISION ENGINE DEBUG]')
  console.log('Symbol:', symbol)

  console.log('Bollinger:', bollinger ?? 'NONE')

  console.log(
    'MACD:',
    macd?.cross ?? 'NONE'
  )

  console.log(
    'FMAI:',
    fmai?.direction ?? 'NONE'
  )

  console.log(
    'Probability:',
    probability.dominant,
    `(confidence ${probability.confidence.toFixed(1)})`
  )

  console.log('ActionGate:', actionGateState)

  console.log('FINAL DECISION:', decision)

  console.log('======================================')
}
