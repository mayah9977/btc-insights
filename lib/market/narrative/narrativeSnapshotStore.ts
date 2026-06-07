//lib/market/narrative/narrativeSnapshotStore.ts    

/* =========================================================
 Narrative Snapshot Store (FINAL - FIXED)
========================================================= */

import { FinalNarrativeReport } from '@/lib/market/narrative/types'
import { BollingerSignalType } from '@/lib/market/actionGate/signalType'
import {
  MarketSnapshot,
  getMarketSnapshot,
} from '@/lib/market/engine/marketSnapshot'

/* =========================================================
 Market Snapshot Shape
========================================================= */
export type NarrativeMarketSnapshot =
  MarketSnapshot & {
    signalType: BollingerSignalType

    confirmedCandleTs?: number
    sampleCount?: number

    oiDelta?: number
    volumeRatio?: number
    whaleIntensity?: number
    whaleNetRatio?: number
    fundingRate?: number

    __institutionalEvidenceEndTs?: number
    __institutionalConfirmedCandleTs?: number
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
 🔥 Snapshot Key (FINALIZED SNAPSHOT SAFE)
========================================================= */
export function createSnapshotKey(
  snapshot: NarrativeMarketSnapshot
): string {

  const confirmedCandleTs =
    snapshot.__institutionalConfirmedCandleTs ??
    snapshot.confirmedCandleTs ??
    snapshot.ts ??
    0

  const evidenceEndTs =
    snapshot.__institutionalEvidenceEndTs ??
    0

  const sampleCount =
    snapshot.sampleCount ??
    0

  const oiDelta =
    snapshot.oiDelta ??
    0

  const volumeRatio =
    snapshot.volumeRatio ??
    1

  const whaleIntensity =
    snapshot.whaleIntensity ??
    0

  const whaleNetRatio =
    snapshot.whaleNetRatio ??
    0

  const fundingRate =
    snapshot.fundingRate ??
    0

  return [
    snapshot.signalType,
    confirmedCandleTs,
    evidenceEndTs,
    sampleCount,
    oiDelta,
    volumeRatio,
    whaleIntensity,
    whaleNetRatio,
    fundingRate,
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
