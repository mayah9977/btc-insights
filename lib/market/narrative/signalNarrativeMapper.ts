/* =========================================================
Signal Narrative Mapper

Role
Market Signals
↓
NarrativeSectionMap

structureSignals   → cause
pressureSignals    → cause
whaleSignals       → cause

liquidationSignals → risk
liquidationMap     → risk
regimeSignals      → risk

guidanceSignals    → strategy

This layer centralizes narrative signal routing.
========================================================= */

import { NarrativeSectionMap } from '@/lib/market/narrative/types'

/* =========================================================
Mapper Input
========================================================= */

export interface NarrativeSignalInput {

  structureSignals?: string[]

  pressureSignals?: string[]

  whaleSignals?: string[]

  liquidationSignals?: string[]

  liquidationMapSignals?: string[]

  regimeSignals?: string[]

  guidanceSignals?: string[]
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
Signal → NarrativeSectionMap
========================================================= */

export function mapSignalsToNarrativeSections(
  input: NarrativeSignalInput
): NarrativeSectionMap {

  const {

    structureSignals,
    pressureSignals,
    whaleSignals,

    liquidationSignals,
    liquidationMapSignals,
    regimeSignals,

    guidanceSignals,

  } = input

  /* =========================================================
  Situation
  (baseDescription handled in composer)
  ========================================================= */

  const situation: string[] = []

  /* =========================================================
  Cause Layer
  OI / Funding / Volume / Whale
  ========================================================= */

  const cause = dedupe([

    ...safeArray(structureSignals),

    ...safeArray(pressureSignals),

    ...safeArray(whaleSignals),

  ])

  /* =========================================================
  Risk Layer
  Liquidation / Regime
  ========================================================= */

  const risk = dedupe([

    ...safeArray(liquidationSignals),

    ...safeArray(liquidationMapSignals),

    ...safeArray(regimeSignals),

  ])

  /* =========================================================
  Strategy Layer
  ========================================================= */

  const strategy = dedupe([

    ...safeArray(guidanceSignals),

  ])

  /* =========================================================
  Return Section Map
  ========================================================= */

  return {

    situation,

    cause,

    risk,

    strategy,

  }
}
