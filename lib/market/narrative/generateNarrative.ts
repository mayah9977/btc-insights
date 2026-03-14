import { ActionGateSentence } from '@/lib/market/actionGate/bollingerSentenceMap'
import { pickSentence } from '@/lib/market/narrative/sentenceVariation'

import { interpretMarketStructure } from '@/lib/market/narrative/marketStructureInterpreter'
import { interpretLiquidation } from '@/lib/market/narrative/liquidationInterpreter'
import { interpretWhaleControl } from '@/lib/market/narrative/whaleControlInterpreter'
import { interpretMarketRegime } from '@/lib/market/narrative/marketRegimeInterpreter'
import { interpretRiskGuidance } from '@/lib/market/narrative/riskGuidanceInterpreter'

import { interpretPositionPressure } from '@/lib/market/pressure/positionPressureInterpreter'
import { interpretLiquidationMap } from '@/lib/market/liquidation/liquidationMapInterpreter'

import { composeFinalNarrativeReport } from '@/lib/market/narrative/finalNarrativeComposer'

import { mapSignalsToNarrativeSections } from '@/lib/market/narrative/signalNarrativeMapper'

import {
  FinalNarrativeReport
} from '@/lib/market/narrative/types'

/* =========================================================
Sentence Cache
signalType 변경 전까지 문장 유지
========================================================= */

const sentenceCache: Record<string, string> = {}

/* =========================================================
Narrative Engine
========================================================= */

export function generateNarrative(
  base: ActionGateSentence
): FinalNarrativeReport {

  /* =========================================================
  Sentence Variation
  ========================================================= */

  const cacheKey = base.summary

  if (!sentenceCache[cacheKey]) {
    sentenceCache[cacheKey] = pickSentence(base.description)
  }

  const baseDescription = sentenceCache[cacheKey]

  /* =========================================================
  Interpreter Engines
  ========================================================= */

  const {
    trends,
    structureSignals,
  } = interpretMarketStructure()

  const { liquidationSignals } = interpretLiquidation()

  const { whaleSignals } = interpretWhaleControl()

  const { regimeSignals } = interpretMarketRegime()

  const { pressureSignals } = interpretPositionPressure()

  const {
    liquidationSignals: liquidationMapSignals
  } = interpretLiquidationMap()

  /* =========================================================
  Cause Layer 강화
  OI / Funding / Volume / Whale 구조 신호 포함
  ========================================================= */

  const causeSignals = [
    ...structureSignals,
    ...pressureSignals,
    ...whaleSignals,
  ]

  /* =========================================================
  Risk Layer
  ========================================================= */

  const riskSignals = [
    ...liquidationSignals,
    ...liquidationMapSignals,
    ...regimeSignals,
  ]

  /* =========================================================
  Strategy Layer
  ========================================================= */

  const { guidanceSignals } =
    interpretRiskGuidance([
      ...causeSignals,
      ...riskSignals,
    ])

  /* =========================================================
  Signal → Narrative Section Mapping
  중앙 관리 Layer
  ========================================================= */

  const sections =
    mapSignalsToNarrativeSections({

      structureSignals: causeSignals,

      pressureSignals,

      whaleSignals,

      liquidationSignals,

      liquidationMapSignals,

      regimeSignals,

      guidanceSignals,

    })

  /* =========================================================
  Final AI Narrative Composer
  ========================================================= */

  const report = composeFinalNarrativeReport({

    summary: base.summary,

    tendency: base.tendency,

    baseDescription,

    sections,

  })

  return report
}
