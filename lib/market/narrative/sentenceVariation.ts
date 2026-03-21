/* =========================================================
Sentence Variation Layer (Refactored)

Role
- select sentence variation deterministically
- prevent repetitive sentence selection
- stable across renders

Strategy
signalType + simple hash → seed 기반 선택
========================================================= */

import { BollingerSignalType } from '@/lib/market/actionGate/signalType'

/* =========================================================
Simple Hash Generator
========================================================= */

function hashSeed(input: string): number {

  let hash = 0

  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }

  return Math.abs(hash)
}

/* =========================================================
Sentence Cache (signalType 기반)
========================================================= */

const sentenceCache: Record<string, string> = {}

/* =========================================================
Pick Sentence (Stable)
========================================================= */

export function pickSentence(
  description: string | string[],
  signalType?: BollingerSignalType
): string {

  /* 단일 문장 */

  if (typeof description === 'string') {
    return description
  }

  /* 배열 보호 */

  if (!Array.isArray(description) || description.length === 0) {
    return ''
  }

  /* signalType 없으면 fallback */

  if (!signalType) {

    const index = Math.floor(Math.random() * description.length)

    return description[index] ?? description[0]
  }

  /* 이미 캐시된 문장 반환 */

  if (sentenceCache[signalType]) {
    return sentenceCache[signalType]
  }

  /* seed 기반 선택 */

  const seed = hashSeed(signalType)

  const index = seed % description.length

  const sentence = description[index] ?? description[0]

  /* 캐시 저장 */

  sentenceCache[signalType] = sentence

  return sentence
}

/* =========================================================
Clear Cache (Optional Debug)
========================================================= */

export function clearSentenceCache() {

  for (const k in sentenceCache) {
    delete sentenceCache[k]
  }
}
