/* =========================================================
 Narrative Snapshot Store (FINAL - FIXED)
========================================================= */

import { FinalNarrativeReport } from '@/lib/market/narrative/types'
import { BollingerSignalType } from '@/lib/market/actionGate/signalType'
import {
  MarketSnapshot,
  getMarketSnapshot
} from '@/lib/market/engine/marketSnapshot'

/* =========================================================
 Market Snapshot Shape
========================================================= */
export type NarrativeMarketSnapshot =
  MarketSnapshot & {
    signalType: BollingerSignalType
  }

/* =========================================================
 Snapshot Cache Map
========================================================= */
const narrativeSnapshotCache =
  new Map<string, FinalNarrativeReport>()

/* =========================================================
 Create Snapshot
========================================================= */
export function createMarketSnapshot(
  signalType: BollingerSignalType
): NarrativeMarketSnapshot {

  const snapshot = getMarketSnapshot()

  return {
    ...snapshot,
    signalType,
  }
}

/* =========================================================
 🔥 Snapshot Key (FIXED)
========================================================= */
export function createSnapshotKey(
  snapshot: NarrativeMarketSnapshot
): string {

  return [
    snapshot.signalType,
    snapshot.ts // 🔥 핵심: 시간 기반 key
  ].join('|')
}

/* =========================================================
 Get Cached Narrative
========================================================= */
export function getCachedNarrative(
  snapshot: NarrativeMarketSnapshot
): FinalNarrativeReport | null {

  const key = createSnapshotKey(snapshot)
  return narrativeSnapshotCache.get(key) ?? null
}

/* =========================================================
 Set Cached Narrative
========================================================= */
export function setCachedNarrative(
  snapshot: NarrativeMarketSnapshot,
  report: FinalNarrativeReport
) {
  const key = createSnapshotKey(snapshot)
  narrativeSnapshotCache.set(key, report)

  if (narrativeSnapshotCache.size > 200) {
    const firstKey =
      narrativeSnapshotCache.keys().next().value

    if (firstKey) {
      narrativeSnapshotCache.delete(firstKey)
    }
  }
}

/* =========================================================
 Clear Cache
========================================================= */
export function clearNarrativeSnapshotCache() {
  narrativeSnapshotCache.clear()
}

/* =========================================================
 Cache Size
========================================================= */
export function getNarrativeCacheSize(): number {
  return narrativeSnapshotCache.size
}
