/* =========================================================
Narrative Signal Aggregator

Role
Multiple Interpreter Signals
↓
Unified Narrative Signal Set

structureSignals
pressureSignals
liquidationSignals
whaleSignals
regimeSignals
↓
unifiedSignals

This layer stabilizes signal routing before
Narrative Section Mapping.
========================================================= */

/* =========================================================
Aggregator Input
========================================================= */

export interface NarrativeSignalAggregatorInput {

  structureSignals?: string[]

  pressureSignals?: string[]

  liquidationSignals?: string[]

  whaleSignals?: string[]

  regimeSignals?: string[]
}

/* =========================================================
Aggregator Result
========================================================= */

export interface NarrativeSignalAggregatorResult {

  unifiedSignals: string[]
}

/* =========================================================
Safe Array Helper
========================================================= */

function safeArray(arr?: string[]): string[] {
  if (!arr) return []
  return Array.isArray(arr) ? arr : []
}

/* =========================================================
Remove Duplicate Signals
========================================================= */

function dedupe(items: string[]): string[] {

  const seen = new Set<string>()

  const result: string[] = []

  for (const item of items) {

    const clean = item.trim()

    if (!clean) continue

    if (!seen.has(clean)) {

      seen.add(clean)

      result.push(clean)
    }
  }

  return result
}

/* =========================================================
Aggregate Narrative Signals
========================================================= */

export function aggregateNarrativeSignals(
  input: NarrativeSignalAggregatorInput
): NarrativeSignalAggregatorResult {

  const {

    structureSignals,
    pressureSignals,
    liquidationSignals,
    whaleSignals,
    regimeSignals,

  } = input

  /* =========================================================
  Unified Signal Set
  ========================================================= */

  const unifiedSignals = dedupe([

    ...safeArray(structureSignals),

    ...safeArray(pressureSignals),

    ...safeArray(liquidationSignals),

    ...safeArray(whaleSignals),

    ...safeArray(regimeSignals),

  ])

  return {
    unifiedSignals
  }
}
