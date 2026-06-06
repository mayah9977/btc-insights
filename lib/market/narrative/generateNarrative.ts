// lib/market/narrative/generateNarrative.ts

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

import { BOLLINGER_SENTENCE_MAP } from '@/lib/market/actionGate/bollingerSentenceMap'

import { useInstitutionalEvidenceStore } from '@/lib/market/institutional/institutionalEvidenceStore'
import { buildInstitutionalNarrative } from '@/lib/market/institutional/institutionalNarrativeEnhancer'

import type {
  InstitutionalEvidenceSnapshot,
} from '@/lib/market/institutional/institutionalEvidenceSnapshot'

const sentenceCache: Record<string, string> = {}

let lastEvidenceEndTs = 0
let lastEvidenceCandleTs = 0
let lastEvidenceSignalType = ''
let lastResult: FinalNarrativeReport | null = null

function createEmptyReport(
  base: ActionGateSentence,
): FinalNarrativeReport {
  return {
    summary: base.summary,
    tendency: base.tendency,
    description: base.description[0] ?? '',
    situation: '',
    cause: '',
    risk: '',
    strategy: '',
  }
}

function createFrozenMarketSnapshot(
  snapshot: InstitutionalEvidenceSnapshot,
  signalType: BollingerSignalType,
) {
  return {
    ...snapshot,

    signalType,

    ts: snapshot.confirmedCandleTs,

    oiDelta: snapshot.oiDeltaAverage,
    oiDeltaRatio: snapshot.oiDeltaAverage,

    fundingRate: snapshot.fundingAverage,

    volumeRatio: snapshot.volumeRatioAverage,

    whaleIntensity: snapshot.whaleIntensityAverage,
    whaleRatio: snapshot.whaleRatioAverage,
    whaleNetRatio: snapshot.whaleNetRatioAverage,

    fmai: snapshot.fmaiAverage,
    absorption: snapshot.absorptionAverage,
    sweep: snapshot.sweepAverage,

    __institutionalConfirmedSignalType:
      snapshot.confirmedSignalType,

    __institutionalEvidenceEndTs:
      snapshot.endTs,

    __institutionalConfirmedCandleTs:
      snapshot.confirmedCandleTs,
  }
}

function createSentenceKey(
  snapshot: InstitutionalEvidenceSnapshot,
  signalType: BollingerSignalType,
): string {
  return [
    signalType,
    snapshot.confirmedSignalType ?? '',
    snapshot.confirmedCandleTs,
    snapshot.endTs,
  ].join('|')
}

export function generateNarrative(
  base: ActionGateSentence,
  signalType: BollingerSignalType,
): FinalNarrativeReport {
  const snapshot =
    useInstitutionalEvidenceStore
      .getState()
      .snapshot

  if (
    !snapshot ||
    snapshot.sampleCount === 0
  ) {
    return createEmptyReport(base)
  }

  return generateNarrativeFromSnapshot(
    snapshot,
    signalType,
  )
}

export function generateNarrativeFromSnapshot(
  snapshot: InstitutionalEvidenceSnapshot,
  signalType: BollingerSignalType,
): FinalNarrativeReport {
  const base =
    BOLLINGER_SENTENCE_MAP[signalType] ||
    BOLLINGER_SENTENCE_MAP[
      BollingerSignalType.INSIDE_CENTER
    ]

  if (
    !snapshot ||
    snapshot.sampleCount === 0
  ) {
    return createEmptyReport(base)
  }

  const evidenceEndTs =
    snapshot.endTs ?? 0

  const evidenceCandleTs =
    snapshot.confirmedCandleTs ?? 0

  const evidenceSignalType =
    snapshot.confirmedSignalType ?? ''

  if (
    evidenceEndTs === lastEvidenceEndTs &&
    evidenceCandleTs === lastEvidenceCandleTs &&
    evidenceSignalType === lastEvidenceSignalType &&
    lastResult
  ) {
    return lastResult
  }

  const frozenSnapshot =
    createFrozenMarketSnapshot(
      snapshot,
      signalType,
    )

  const cached =
    getCachedNarrative(frozenSnapshot as any)

  if (cached) {
    lastEvidenceEndTs = evidenceEndTs
    lastEvidenceCandleTs = evidenceCandleTs
    lastEvidenceSignalType = evidenceSignalType
    lastResult = cached

    return cached
  }

  const sentenceKey =
    createSentenceKey(
      snapshot,
      signalType,
    )

  if (!sentenceCache[sentenceKey]) {
    sentenceCache[sentenceKey] =
      pickSentence(
        base.description,
        signalType,
      )
  }

  const strategyBase =
    sentenceCache[sentenceKey]

  const institutionalLines =
    buildInstitutionalNarrative(snapshot)

  const reinforcedStrategyBase = [
    strategyBase,
    ...institutionalLines,
  ].join(' ')

  const interpreterResult =
    runInterpreterEngine(
      frozenSnapshot as any,
    )

  const {
    structureSignals,
    liquidationSignals,
    whaleSignals,
    regimeSignals,
    pressureSignals,
    liquidationMapSignals,
  } = interpreterResult

  const signal =
    buildSignal({
      ...interpreterResult,
      snapshot: frozenSnapshot as any,
    })

  const prioritized =
    applySignalPriority({
      liquidationSignals: [
        ...liquidationSignals.map((s) => s.type),
        ...liquidationMapSignals.map((s) => s.type),
      ],
      whaleSignals:
        whaleSignals.map((s) => s.type),
      pressureSignals:
        pressureSignals.map((s) => s.type),
      structureSignals:
        structureSignals.map((s) => s.type),
      regimeSignals:
        regimeSignals.map((s) => s.type),
    })

  const sections =
    mapSignalsToNarrativeSections(
      prioritized,
    )

  const report =
    composeFinalNarrativeReport({
      summary: base.summary,
      tendency: base.tendency,
      baseDescription:
        reinforcedStrategyBase,
      sections,
      signal,
      snapshot: frozenSnapshot as any,
      institutionalSnapshot: snapshot,
    })

  setCachedNarrative(
    frozenSnapshot as any,
    report,
  )

  lastEvidenceEndTs = evidenceEndTs
  lastEvidenceCandleTs = evidenceCandleTs
  lastEvidenceSignalType = evidenceSignalType
  lastResult = report

  return report
}
