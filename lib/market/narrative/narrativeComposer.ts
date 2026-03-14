/* =========================================================
Narrative Composer
Signal → Final Narrative Sentence
========================================================= */

export interface NarrativeComposeInput {

  trends: string[]
  structureSignals: string[]
  liquidationSignals: string[]
  whaleSignals: string[]
  regimeSignals: string[]
  pressureSignals: string[]
}

export interface NarrativeComposeResult {

  narrativeSentence: string
}

/* =========================================================
Priority Order
청산 > 포지션압력 > 고래 > 구조 > 시장 상태
========================================================= */

const SIGNAL_PRIORITY = {

  LIQUIDATION: 1,
  PRESSURE: 2,
  WHALE: 3,
  STRUCTURE: 4,
  REGIME: 5,
}

/* =========================================================
Signal Deduplication
(Set 기반 안전한 중복 제거)
========================================================= */

function dedupeSignals(signals: string[]): string[] {

  const seen = new Set<string>()
  const result: string[] = []

  for (const s of signals) {

    const key = s.trim()

    if (!seen.has(key)) {
      seen.add(key)
      result.push(s)
    }
  }

  return result
}

/* =========================================================
Compose Narrative
========================================================= */

export function composeNarrative(
  input: NarrativeComposeInput
): NarrativeComposeResult {

  const {
    trends,
    structureSignals,
    liquidationSignals,
    whaleSignals,
    regimeSignals,
    pressureSignals,
  } = input

  /* =========================================================
  Priority Merge
  ========================================================= */

  let mergedSignals: string[] = [

    ...liquidationSignals,
    ...pressureSignals,
    ...whaleSignals,
    ...structureSignals,
    ...regimeSignals,
  ]

  /* =========================================================
  Remove Duplicate Signals
  ========================================================= */

  mergedSignals = dedupeSignals(mergedSignals)

  /* =========================================================
  Build Narrative Sentence
  ========================================================= */

  let sentence = ''

  if (mergedSignals.length > 0) {

    sentence = mergedSignals.join(' ')
  }

  else if (trends.length === 1) {

    sentence =
      `${trends[0]} 흐름이 나타나고 있습니다`
  }

  else if (trends.length === 2) {

    sentence =
      `${trends[0]}와 ${trends[1]} 흐름이 동시에 나타나고 있습니다`
  }

  else if (trends.length >= 3) {

    sentence =
      `${trends[0]}와 ${trends[1]} 흐름이 나타나며 ${trends[2]} 흐름이 동반되고 있습니다`
  }

  else {

    sentence =
      '시장 구조 변화는 제한적이며 에너지 축적 구간이 지속되고 있습니다'
  }

  return {

    narrativeSentence: sentence,
  }
}
