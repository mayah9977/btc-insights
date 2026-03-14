/* =========================================================
Narrative Signal Aggregator

Role
Multiple Interpreter Signals
↓
Unified Signal Set

structureSignals
pressureSignals
liquidationSignals
liquidationMapSignals
whaleSignals
regimeSignals

→ unifiedSignals

This layer prevents duplicated signals and provides
a normalized signal set for downstream narrative engines.
========================================================= */

/* =========================================================
Input Structure
========================================================= */

export interface NarrativeSignalInput {

  structureSignals?: string[]

  pressureSignals?: string[]

  liquidationSignals?: string[]

  liquidationMapSignals?: string[]

  whaleSignals?: string[]

  regimeSignals?: string[]

}

/* =========================================================
Output Structure
========================================================= */

export interface NarrativeAggregatedSignals {

  unifiedSignals: string[]

}

/* =========================================================
Utility
========================================================= */

function safeArray(arr?: string[]): string[] {
  if (!arr) return []
  return Array.isArray(arr) ? arr : []
}

/* =========================================================
Remove Duplicate Signals
========================================================= */

function dedupeSignals(signals: string[]): string[] {

  const seen = new Set<string>()
  const result: string[] = []

  for (const s of signals) {

    const clean = s.trim()

    if (!clean) continue

    if (!seen.has(clean)) {
      seen.add(clean)
      result.push(clean)
    }
  }

  return result
}

/* =========================================================
Basic Conflict Resolution
========================================================= */

function resolveConflicts(signals: string[]): string[] {

  const resolved: string[] = []

  let hasLongLiquidation = false
  let hasShortLiquidation = false

  for (const s of signals) {

    if (s.includes('롱 포지션 청산')) {
      hasLongLiquidation = true
    }

    if (s.includes('숏 포지션 청산')) {
      hasShortLiquidation = true
    }

    resolved.push(s)
  }

  /* Example conflict rule */

  if (hasLongLiquidation && hasShortLiquidation) {

    return resolved.filter(
      s =>
        !(
          s.includes('롱 포지션 청산') &&
          s.includes('숏 포지션 청산')
        )
    )
  }

  return resolved
}

/* =========================================================
Aggregate Signals
========================================================= */

export function aggregateNarrativeSignals(
  input: NarrativeSignalInput
): NarrativeAggregatedSignals {

  const {

    structureSignals,
    pressureSignals,
    liquidationSignals,
    liquidationMapSignals,
    whaleSignals,
    regimeSignals,

  } = input

  const collectedSignals = [

    ...safeArray(structureSignals),

    ...safeArray(pressureSignals),

    ...safeArray(liquidationSignals),

    ...safeArray(liquidationMapSignals),

    ...safeArray(whaleSignals),

    ...safeArray(regimeSignals),

  ]

  const uniqueSignals = dedupeSignals(collectedSignals)

  const resolvedSignals = resolveConflicts(uniqueSignals)

  return {

    unifiedSignals: resolvedSignals

  }
}
