/* =========================================================
 AI Narrative Final Composer (FINAL - CLEAN)
========================================================= */

import {
  FinalNarrativeReport,
  NarrativeSectionMap,
} from '@/lib/market/narrative/types'

import { MarketSnapshot } from '@/lib/market/engine/marketSnapshot'

import {
  buildCause,
  buildRisk,
} from '@/lib/market/narrative/numericNarrativeBuilder'

import { MarketSignal } from '@/lib/market/signalEngine'

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
  sections: NarrativeSectionMap
  signal: MarketSignal
  snapshot: MarketSnapshot
}): FinalNarrativeReport {

  const {
    summary,
    tendency,
    baseDescription,
    sections,
    signal,
    snapshot,
  } = params

  /* =========================================================
   🔥 1️⃣ Situation 제거 (핵심)
  ========================================================= */
  const situation = ''

  /* =========================================================
   🔥 2️⃣ Cause (핵심)
  ========================================================= */
  const normalizedCauseSignals = normalizeSignals(
    sections?.cause ?? [],
  )

  const cause = buildCause({
    snapshot,
    causeSignals: normalizedCauseSignals,
  })

  /* =========================================================
   3️⃣ Risk
  ========================================================= */
  const risk = buildRisk({
    snapshot,
    signal,
  })

  /* =========================================================
   4️⃣ Strategy
  ========================================================= */
  const strategyParts: string[] = []

  if (baseDescription) {
    strategyParts.push(baseDescription)
  }

  if (sections?.strategy?.length) {
    const normalizedStrategy = normalizeSignals(
      sections.strategy,
    )
    strategyParts.push(...normalizedStrategy)
  }

  const strategy =
    strategyParts.length > 0
      ? strategyParts.join(' ')
      : '관망 또는 리스크 관리 중심 대응 권장'

  /* =========================================================
   🔥 Final Description (situation 제거)
  ========================================================= */
  const description = [cause, risk, strategy]
    .filter(Boolean)
    .join(' ')

  return {
    summary,
    tendency,
    situation, // 빈값 유지 (구조 호환)
    cause,
    risk,
    strategy,
    description,
  }
}
