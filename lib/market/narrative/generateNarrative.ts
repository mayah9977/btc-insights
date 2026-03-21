import { ActionGateSentence } from '@/lib/market/actionGate/bollingerSentenceMap'
import { pickSentence } from '@/lib/market/narrative/sentenceVariation'

import { composeFinalNarrativeReport } from '@/lib/market/narrative/finalNarrativeComposer'
import { mapSignalsToNarrativeSections } from '@/lib/market/narrative/signalNarrativeMapper'

import { FinalNarrativeReport } from '@/lib/market/narrative/types'

import {
  getCachedNarrative,
  setCachedNarrative,
} from '@/lib/market/narrative/narrativeSnapshotStore'

import { applySignalPriority } from '@/lib/market/narrative/signalPriorityEngine'
import { BollingerSignalType } from '@/lib/market/actionGate/signalType'

import { runInterpreterEngine } from '@/lib/market/engine/interpreterEngine'
import { buildSignal } from '@/lib/market/signalEngine'

/* 🔥 핵심 */
import { getMarketSnapshot } from '@/lib/market/engine/marketSnapshot'

/* =========================================================
   Sentence Cache
========================================================= */
const sentenceCache: Record<string, string> = {}

/* 🔥 ultra fast cache */
let lastTs = 0
let lastResult: FinalNarrativeReport | null = null

/* =========================================================
   Narrative Engine
========================================================= */
export function generateNarrative(
  base: ActionGateSentence,
  signalType: BollingerSignalType,
): FinalNarrativeReport {

  /* =========================================================
     Snapshot
  ========================================================= */
  const snapshot = getMarketSnapshot()

  /* 🔥 ultra fast cache */
  if (snapshot.ts === lastTs && lastResult) {
    return lastResult
  }

  /* 🔥 기존 캐시 */
  const cachePayload = {
    ...snapshot,
    signalType,
    __ts: snapshot.ts,
  }

  const cached = getCachedNarrative(cachePayload as any)
  if (cached) return cached

  /* =========================================================
     Strategy Base
  ========================================================= */
  const sentenceKey = `${signalType}_${snapshot.ts}`

  if (!sentenceCache[sentenceKey]) {
    sentenceCache[sentenceKey] =
      pickSentence(base.description, signalType)
  }

  const strategyBase = sentenceCache[sentenceKey]

  /* =========================================================
     🔥 Interpreter (항상 실행)
  ========================================================= */
  const shouldRunHeavy = true

  const interpreterResult = shouldRunHeavy
    ? runInterpreterEngine(snapshot)
    : {
        structureSignals: [],
        liquidationSignals: [],
        whaleSignals: [],
        regimeSignals: [],
        pressureSignals: [],
        liquidationMapSignals: [],
        allSignals: [],
      }

  const {
    structureSignals,
    liquidationSignals,
    whaleSignals,
    regimeSignals,
    pressureSignals,
    liquidationMapSignals,
  } = interpreterResult

  /* =========================================================
     🔥 signal 없으면 즉시 종료
  ========================================================= */
  if (
    !structureSignals.length &&
    !liquidationSignals.length &&
    !whaleSignals.length &&
    !regimeSignals.length &&
    !pressureSignals.length &&
    !liquidationMapSignals.length
  ) {
    const empty: FinalNarrativeReport = {
      summary: base.summary,
      tendency: base.tendency,
      description: strategyBase,
      situation: '',
      cause: '',
      risk: '',
      strategy: '',
    }

    lastTs = snapshot.ts
    lastResult = empty

    return empty
  }

  /* =========================================================
     Signal
  ========================================================= */
  const signal = buildSignal({
    ...interpreterResult,
    snapshot,
  })

  /* =========================================================
     🔥 Priority (한 번만 계산)
  ========================================================= */
  const prioritized = applySignalPriority({
    liquidationSignals: [
      ...liquidationSignals.map((s) => s.type),
      ...liquidationMapSignals.map((s) => s.type),
    ],
    whaleSignals: whaleSignals.map((s) => s.type),
    pressureSignals: pressureSignals.map((s) => s.type),
    structureSignals: structureSignals.map((s) => s.type),
    regimeSignals: regimeSignals.map((s) => s.type),
  })

  /* =========================================================
     🔥 Mapper (경량화된 구조)
  ========================================================= */
  const sections = mapSignalsToNarrativeSections(
    prioritized,
  )

  /* =========================================================
     Final Composer
  ========================================================= */
  const report = composeFinalNarrativeReport({
    summary: base.summary,
    tendency: base.tendency,
    baseDescription: strategyBase,
    sections,
    signal,
    snapshot,
  })

  /* =========================================================
     Cache Save
  ========================================================= */
  setCachedNarrative(cachePayload as any, report)

  lastTs = snapshot.ts
  lastResult = report

  return report
}
