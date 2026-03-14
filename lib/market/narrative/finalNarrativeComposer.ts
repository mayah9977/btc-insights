/* =========================================================
AI Narrative Final Composer
4-Stage Market Report Generator

Structure
1. Situation
2. Cause
3. Risk
4. Strategy

Author: VIP Market AI Engine
========================================================= */

import {
  FinalNarrativeReport,
  NarrativeSectionMap,
} from '@/lib/market/narrative/types'

/* =========================================================
Remove duplicate sentences
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
Join clauses naturally
========================================================= */

function joinClauses(items: string[], fallback: string): string {

  const cleaned = dedupe(items)

  if (cleaned.length === 0) return fallback
  if (cleaned.length === 1) return cleaned[0]
  if (cleaned.length === 2) return `${cleaned[0]} ${cleaned[1]}`

  return cleaned.join(' ')
}

/* =========================================================
Sentence finished check
========================================================= */

function isFinishedSentence(text: string): boolean {
  return (
    /합니다$/.test(text) ||
    /됩니다$/.test(text) ||
    /있습니다$/.test(text) ||
    /필요합니다$/.test(text) ||
    /권장합니다$/.test(text)
  )
}

/* =========================================================
Check noun ending
========================================================= */

function isNounEnding(text: string): boolean {

  const nounEnding =
    /(구간|흐름|상태|압력|영역|시장|구조|국면)$/

  return nounEnding.test(text)
}

/* =========================================================
Sentence normalization
========================================================= */

function normalizeEnding(
  text: string,
  type: 'SITUATION' | 'CAUSE' | 'RISK' | 'STRATEGY'
): string {

  let t = text.trim()

  /* punctuation 제거 */

  t = t.replace(/[.。]$/, '')

  /* 중복 어미 제거 */

  t = t.replace(/되고 있고$/, '되고')
  t = t.replace(/있습니다$/, '')
  t = t.replace(/있고$/, '')
  t = t.replace(/있으며$/, '')
  t = t.replace(/됩니다$/, '')
  t = t.replace(/합니다$/, '')
  t = t.replace(/입니다$/, '')
  t = t.replace(/높습니다$/, '')
  t = t.replace(/가능성이 있습니다$/, '가능성이')

  t = t.trim()

  /* 이미 절이 완성된 경우 */

  if (/고$|며$|되고$|나타나고$|형성되고$/.test(t)) {

    if (type === 'STRATEGY') {
      return `${t} 있습니다.`
    }

    return `${t}`
  }

  /* fallback */

  if (!t) {

    if (type === 'SITUATION')
      return '시장 흐름이 제한적으로 나타나고 있으며'

    if (type === 'CAUSE')
      return '복합적인 시장 요인이 작용하며'

    if (type === 'RISK')
      return '추가 변동성이 발생할 가능성이 높으므로'

    return '무리한 진입보다는 관망 전략이 필요합니다.'
  }

  switch (type) {

    /* ------------------------------- */
    /* Situation */
    /* ------------------------------- */

    case 'SITUATION': {

      if (isNounEnding(t)) {
        return `${t}이며`
      }

      return `${t}고 있으며`
    }

    /* ------------------------------- */
    /* Cause */
    /* ------------------------------- */

    case 'CAUSE': {

      if (isNounEnding(t)) {
        return `${t}이고`
      }

      return `${t}며`
    }

    /* ------------------------------- */
    /* Risk */
    /* ------------------------------- */

    case 'RISK': {

      if (isNounEnding(t)) {
        return `${t}일 가능성이 높으므로`
      }

      return `${t} 가능성이 높아`
    }

    /* ------------------------------- */
    /* Strategy */
    /* ------------------------------- */

    case 'STRATEGY': {

      if (isFinishedSentence(t)) {
        return `${t}.`
      }

      if (/권장$/.test(t)) {
        return `${t}합니다.`
      }

      if (/필요$/.test(t)) {
        return `${t}합니다.`
      }

      /* 수 있습니다 오류 방지 */

      if (t.endsWith('수 있')) {
        return `${t}습니다.`
      }

      return `${t}습니다.`
        .replace('수습니다', '수 있습니다')
    }
  }
}

/* =========================================================
Compose Final Narrative Report
========================================================= */

export function composeFinalNarrativeReport(params: {
  summary: string
  tendency: string
  baseDescription: string
  sections: NarrativeSectionMap
}): FinalNarrativeReport {

  const { summary, tendency, baseDescription, sections } = params

  /* =========================================================
  Situation
  ========================================================= */

  const base = baseDescription
    .replace(/[.。]$/, '')
    .replace(/있습니다$/, '')
    .replace(/입니다$/, '')

  const situationRaw = joinClauses(
    [base, ...sections.situation],
    '시장 흐름이 제한적으로 전개되'
  )

  const situation = normalizeEnding(
    situationRaw,
    'SITUATION'
  )

  /* =========================================================
  Cause
  ========================================================= */

  const causeRaw = joinClauses(
    sections.cause,
    '추가적인 시장 원인이 제한적으로 반영되'
  )

  const cause = normalizeEnding(
    causeRaw,
    'CAUSE'
  )

  /* =========================================================
  Risk
  ========================================================= */

  const riskRaw = joinClauses(
    sections.risk,
    '방향성 탐색 흐름이 지속될'
  )

  const risk = normalizeEnding(
    riskRaw,
    'RISK'
  )

  /* =========================================================
  Strategy
  ========================================================= */

  const strategyRaw = joinClauses(
    sections.strategy,
    '무리한 진입보다는 관망 전략이 유리할 수 있'
  )

  const strategy = normalizeEnding(
    strategyRaw,
    'STRATEGY'
  )

  /* =========================================================
  Final description
  ========================================================= */

  const description =
    `${situation} ${cause} ${risk} ${strategy}`

  return {
    summary,
    tendency,

    situation,
    cause,
    risk,
    strategy,

    description,
  }
}
