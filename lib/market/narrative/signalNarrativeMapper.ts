/* =========================================================
   Signal Narrative Mapper (ULTRA LIGHT VERSION)
========================================================= */

import { NarrativeSectionMap } from '@/lib/market/narrative/types'
import { NarrativeSignalGroups } from '@/lib/market/narrative/signalPriorityEngine'

/* =========================================================
   Main Mapper (🔥 완전 경량화)
========================================================= */
export function mapSignalsToNarrativeSections(
  input: NarrativeSignalGroups,
): NarrativeSectionMap {

  const cause = [
    ...(input.structureSignals ?? []),
    ...(input.pressureSignals ?? []),
    ...(input.whaleSignals ?? []),
  ]

  const risk = [
    ...(input.liquidationSignals ?? []),
    ...(input.regimeSignals ?? []),
  ]

  return {
    situation: [],
    cause,
    risk,
    strategy: [],
  }
}
