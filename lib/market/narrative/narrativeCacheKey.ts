/* =========================================================
Narrative Cache Key Generator

Role
signalType + market state → narrative key
market state only → interpreter key

Purpose
1. Prevent repeated narrative generation
2. Detect market state change
3. Separate UI (signalType) vs Market (snapshot)
========================================================= */

import { BollingerSignalType } from '@/lib/market/actionGate/signalType'
import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

/* =========================================================
Narrative Cache Key Input (with signalType)
========================================================= */

export interface NarrativeCacheKeyInput {

  signalType: BollingerSignalType

  oiDelta: number

  volumeRatio: number

  whaleNetRatio: number

  fundingBias: string

  actionGateState: string
}

/* =========================================================
Interpreter Cache Key Input (NO signalType)
========================================================= */

export interface InterpreterCacheKeyInput {

  oiDelta: number

  volumeRatio: number

  whaleNetRatio: number

  fundingBias: string

  actionGateState: string
}

/* =========================================================
Create Narrative Snapshot (with signalType)
========================================================= */

export function createNarrativeCacheInput(
  signalType: BollingerSignalType
): NarrativeCacheKeyInput {

  const market = useVIPMarketStore.getState()

  return {

    signalType,

    oiDelta: market.oiDelta ?? 0,

    volumeRatio: market.volumeRatio ?? 1,

    whaleNetRatio: market.whaleNetRatio ?? 0,

    fundingBias: market.fundingBias ?? 'NEUTRAL',

    actionGateState: market.actionGateState ?? 'OBSERVE',
  }
}

/* =========================================================
Create Interpreter Snapshot (NO signalType)
========================================================= */

export function createInterpreterCacheInput(): InterpreterCacheKeyInput {

  const market = useVIPMarketStore.getState()

  return {

    oiDelta: market.oiDelta ?? 0,

    volumeRatio: market.volumeRatio ?? 1,

    whaleNetRatio: market.whaleNetRatio ?? 0,

    fundingBias: market.fundingBias ?? 'NEUTRAL',

    actionGateState: market.actionGateState ?? 'OBSERVE',
  }
}

/* =========================================================
Narrative Cache Key (with signalType)
========================================================= */

export function createNarrativeCacheKey(
  input: NarrativeCacheKeyInput
): string {

  return [

    input.signalType,

    input.oiDelta.toFixed(6),

    input.volumeRatio.toFixed(3),

    input.whaleNetRatio.toFixed(4),

    input.fundingBias,

    input.actionGateState

  ].join('|')
}

/* =========================================================
Interpreter Cache Key (NO signalType)
========================================================= */

export function createInterpreterCacheKey(
  input: InterpreterCacheKeyInput
): string {

  return [

    input.oiDelta.toFixed(6),

    input.volumeRatio.toFixed(3),

    input.whaleNetRatio.toFixed(4),

    input.fundingBias,

    input.actionGateState

  ].join('|')
}

/* =========================================================
Shortcut: Narrative Key
========================================================= */

export function generateNarrativeCacheKey(
  signalType: BollingerSignalType
): string {

  const snapshot = createNarrativeCacheInput(signalType)

  return createNarrativeCacheKey(snapshot)
}

/* =========================================================
Shortcut: Interpreter Key
========================================================= */

export function generateInterpreterCacheKey(): string {

  const snapshot = createInterpreterCacheInput()

  return createInterpreterCacheKey(snapshot)
}
