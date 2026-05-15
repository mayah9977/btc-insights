// lib/market/narrative/finalNarrativeComposer.ts

/* =========================================================
AI Narrative Final Composer (FINAL - REALTIME STRUCTURED)
========================================================= */

import {
  FinalNarrativeReport,
  NarrativeSectionMap,
} from '@/lib/market/narrative/types'

import { MarketSnapshot } from '@/lib/market/engine/marketSnapshot'

import {
  buildCause,
  buildRisk,
  buildSituation,
} from '@/lib/market/narrative/numericNarrativeBuilder'

import { MarketSignal } from '@/lib/market/signalEngine'

import type {
  InstitutionalEvidenceSnapshot,
} from '@/lib/market/institutional/institutionalEvidenceSnapshot'

/* =========================================================
🔥 causeSignals 안전 정규화
========================================================= */
function normalizeSignals(arr: any[]): string[] {
  if (!arr?.length) return []

  return arr
    .map((s) => {
      if (!s) return null

      if (typeof s === 'string') return s

      if (typeof s === 'object') {
        return s.text || s.label || s.type || null
      }

      return null
    })
    .filter(Boolean)
}

/* =========================================================
Compose Final Narrative Report
========================================================= */
export function composeFinalNarrativeReport(params: {
  summary: string
  tendency: string
  baseDescription: string
  sections: NarrativeSectionMap | any
  signal: MarketSignal | any
  snapshot: MarketSnapshot | any
  institutionalSnapshot?:
    | InstitutionalEvidenceSnapshot
    | null
}): FinalNarrativeReport {
  const {
    summary,
    tendency,
    baseDescription,
    sections,
    signal,
    snapshot,
  } = params

  // 1. 기존의 정밀한 buildCause 호출
  const indicators = buildCause({
    snapshot,
    causeSignals:
      normalizeSignals(sections?.cause ?? []),
  })

  // 2. 조립 (정밀 데이터 + 전략)
  // Compact narrative flow without verbose connector wording
  const description =
    `${indicators}. ${baseDescription}`

  return {
    summary,
    tendency,
    situation: buildSituation(snapshot),
    cause: indicators,
    risk: buildRisk({ snapshot, signal }),
    strategy: baseDescription,
    description,
  }
}
