/* =========================================================
Interpreter Cache

Role
MarketSnapshot 기반 Interpreter 결과 캐싱

Purpose
1. Prevent repeated interpreter execution
2. Improve performance on enum (signalType) changes
3. Decouple market state from UI state
========================================================= */

import { MarketSnapshot } from './marketSnapshot'
import { InterpreterEngineResult } from './interpreterEngine'

/* =========================================================
Cache Map
========================================================= */

const interpreterCache =
  new Map<string, InterpreterEngineResult>()

/* =========================================================
Create Snapshot Key (signalType 제외)
========================================================= */

function createInterpreterCacheKey(
  snapshot: MarketSnapshot
): string {

  return [

    snapshot.oiDelta.toFixed(6),

    snapshot.volumeRatio.toFixed(3),

    snapshot.whaleNetRatio.toFixed(4),

    snapshot.fundingBias,

    snapshot.actionGateState,

    snapshot.ts

  ].join('|')
}

/* =========================================================
Get Cached Interpreter Result
========================================================= */

export function getCachedInterpreter(
  snapshot: MarketSnapshot
): InterpreterEngineResult | null {

  const key = createInterpreterCacheKey(snapshot)

  return interpreterCache.get(key) ?? null
}

/* =========================================================
Set Cached Interpreter Result
========================================================= */

export function setCachedInterpreter(
  snapshot: MarketSnapshot,
  result: InterpreterEngineResult
) {

  const key = createInterpreterCacheKey(snapshot)

  interpreterCache.set(key, result)

  /* Prevent memory leak */

  if (interpreterCache.size > 300) {

    const firstKey =
      interpreterCache.keys().next().value

    if (firstKey) {
      interpreterCache.delete(firstKey)
    }
  }
}

/* =========================================================
Clear Cache (Debug)
========================================================= */

export function clearInterpreterCache() {

  interpreterCache.clear()
}

/* =========================================================
Cache Size (Debug)
========================================================= */

export function getInterpreterCacheSize(): number {

  return interpreterCache.size
}
