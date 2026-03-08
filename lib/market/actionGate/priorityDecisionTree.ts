/* =========================================================
   🧠 Adaptive Weight Decision Engine (Final)
========================================================= */

import type { ActionGateState } from '@/components/system/ActionGateStatus'
import { BollingerSignalType } from '@/lib/market/actionGate/signalType'
import type { MACDResult } from '@/lib/market/macd'
import type { DirectionalProbabilityResult } from '@/lib/market/institutionalProbability'
import type { FinalDecision } from './decisionEngine'
import type { FMAIResult } from '@/lib/market/momentum/futuresMomentumAlignment'
import { getLastFMAI } from '@/lib/market/store/fmaiStateStore'

import type { AbsorptionDirection } from '@/lib/market/detector/whaleAbsorptionDetector'
import type { MarketRegime } from '@/lib/market/regime/marketRegimeDetector'

/* ========================================================= */

interface PriorityDecisionInput {
  symbol: string
  actionGateState: ActionGateState
  bollingerSignal: BollingerSignalType | null
  macd: MACDResult | null
  probability: DirectionalProbabilityResult
  fmai: FMAIResult | null

  /* 🔥 NEW */
  absorption?: AbsorptionDirection
  regime?: MarketRegime
}

/* ========================================================= */

export function evaluatePriorityDecisionTree({
  symbol,
  actionGateState,
  bollingerSignal,
  macd,
  probability,
  fmai,
  absorption,
  regime,
}: PriorityDecisionInput): FinalDecision {

  /* =========================================================
     FMAI stale protection
  ========================================================= */

  const storedFMAI = getLastFMAI(symbol)

  const effectiveFMAI =
    fmai ??
    (storedFMAI && Date.now() - (storedFMAI as any).ts < 60000
      ? storedFMAI
      : null)

  /* =========================================================
     1️⃣ Bollinger Direction
  ========================================================= */

  let bollingerLong = false
  let bollingerShort = false

  if (
    bollingerSignal ===
      BollingerSignalType.OUTSIDE_LOWER_CROSS_UP_OVER_LOWER ||
    bollingerSignal ===
      BollingerSignalType.OUTSIDE_LOWER_RETURN_INSIDE
  ) {
    bollingerLong = true
  }

  if (
    bollingerSignal ===
      BollingerSignalType.OUTSIDE_UPPER_RETRACE_OVER_UPPER ||
    bollingerSignal ===
      BollingerSignalType.OUTSIDE_UPPER_RETURN_INSIDE
  ) {
    bollingerShort = true
  }

  /* =========================================================
     TAKE PROFIT
  ========================================================= */

  if (
    bollingerSignal ===
    BollingerSignalType.INSIDE_UPPER_CLOSE_ABOVE
  ) {
    return 'TAKE_PROFIT_LONG'
  }

  if (
    bollingerSignal ===
    BollingerSignalType.INSIDE_LOWER_CLOSE_BELOW
  ) {
    return 'TAKE_PROFIT_SHORT'
  }

  /* =========================================================
     2️⃣ MACD
  ========================================================= */

  const macdLong = macd?.cross === 'GOLDEN'
  const macdShort = macd?.cross === 'DEAD'

  /* =========================================================
     3️⃣ FMAI
  ========================================================= */

  const fmaiLong =
    effectiveFMAI?.direction === 'STRONG_LONG'

  const fmaiShort =
    effectiveFMAI?.direction === 'STRONG_SHORT'

  /* =========================================================
     4️⃣ Institutional Probability
  ========================================================= */

  const probLong =
    probability.dominant === 'LONG' &&
    probability.confidence >= 65

  const probShort =
    probability.dominant === 'SHORT' &&
    probability.confidence >= 65

  /* =========================================================
     5️⃣ Absorption
  ========================================================= */

  const absorptionLong = absorption === 'LONG'
  const absorptionShort = absorption === 'SHORT'

  /* =========================================================
     6️⃣ Regime Weight Modifier
  ========================================================= */

  const regimeTrend = regime === 'TREND'
  const regimeRange = regime === 'RANGE'

  /* =========================================================
     7️⃣ Active Indicator Detection
  ========================================================= */

  const activeIndicators = []

  if (bollingerLong || bollingerShort) activeIndicators.push('bollinger')
  if (macdLong || macdShort) activeIndicators.push('macd')
  if (fmaiLong || fmaiShort) activeIndicators.push('fmai')
  if (probLong || probShort) activeIndicators.push('prob')
  if (absorptionLong || absorptionShort) activeIndicators.push('absorption')

  const indicatorCount = activeIndicators.length

  if (indicatorCount === 0) {
    return 'WAIT'
  }

  const weight = 1 / indicatorCount

  /* =========================================================
     8️⃣ Weighted Score Calculation
  ========================================================= */

  let longScore = 0
  let shortScore = 0

  if (bollingerLong) longScore += weight
  if (bollingerShort) shortScore += weight

  if (macdLong) longScore += weight
  if (macdShort) shortScore += weight

  if (fmaiLong) longScore += weight
  if (fmaiShort) shortScore += weight

  if (probLong) longScore += weight
  if (probShort) shortScore += weight

  if (absorptionLong) longScore += weight
  if (absorptionShort) shortScore += weight

  /* =========================================================
     9️⃣ Regime Adjustment
  ========================================================= */

  if (regimeTrend) {
    longScore *= 1.15
    shortScore *= 1.15
  }

  if (regimeRange) {
    longScore *= 0.9
    shortScore *= 0.9
  }

  /* =========================================================
     🔟 Action Gate Risk Filter
  ========================================================= */

  if (actionGateState === 'IGNORE') {
    return 'BLOCKED_BY_GATE'
  }

  if (actionGateState === 'CAUTION') {
    if (longScore > shortScore) return 'REDUCE_LONG'
    if (shortScore > longScore) return 'REDUCE_SHORT'
  }

  /* =========================================================
     11️⃣ Indicator 충돌 처리
  ========================================================= */

  if (longScore === shortScore) {

    if (longScore > 0) return 'HOLD_LONG'
    if (shortScore > 0) return 'HOLD_SHORT'

    return 'WAIT'
  }

  const dominantLong = longScore > shortScore
  const score = dominantLong ? longScore : shortScore

  /* =========================================================
     12️⃣ Final Decision Mapping
  ========================================================= */

  if (score >= 0.80) {
    return dominantLong ? 'EXTREME_LONG' : 'EXTREME_SHORT'
  }

  if (score >= 0.60) {
    return dominantLong ? 'LONG_ENTRY' : 'SHORT_ENTRY'
  }

  if (score >= 0.30) {
    return dominantLong ? 'HOLD_LONG' : 'HOLD_SHORT'
  }

  return 'WAIT'
}
