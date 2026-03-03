/* =========================================================
   🧠 Priority Decision Tree (Re-Designed)
   - 1️⃣ Bollinger → 항상 1순위 방향 축
   - 2️⃣ MACD → 진입 확정
   - 3️⃣ FMAI → 가속도/강한 정렬 감지
   - 4️⃣ Institutional Probability → 독립 진입 + Boost
   - 5️⃣ ActionGate → 약화 전용 (차단 제거)
========================================================= */

import type { ActionGateState } from '@/components/system/ActionGateStatus'
import { BollingerSignalType } from '@/lib/market/actionGate/signalType'
import type { MACDResult } from '@/lib/market/macd'
import type { DirectionalProbabilityResult } from '@/lib/market/institutionalProbability'
import type { FinalDecision } from './decisionEngine'
import type { FMAIResult } from '@/lib/market/momentum/futuresMomentumAlignment'

/* 🔥 FMAI Store 추가 */
import { getLastFMAI } from '@/lib/market/store/fmaiStateStore'

/* ========================================================= */

interface PriorityDecisionInput {
  symbol: string                    // 🔥 추가
  actionGateState: ActionGateState
  bollingerSignal: BollingerSignalType | null
  macd: MACDResult | null
  probability: DirectionalProbabilityResult
  fmai: FMAIResult | null
}

/* ========================================================= */

export function evaluatePriorityDecisionTree({
  symbol,
  actionGateState,
  bollingerSignal,
  macd,
  probability,
  fmai,
}: PriorityDecisionInput): FinalDecision {

  /* 🔥 Store에서 FMAI 읽기 (fallback) */
  const storedFMAI = getLastFMAI(symbol)
  const effectiveFMAI = fmai ?? storedFMAI

  /* =========================================================
     1️⃣ Bollinger → 방향 기본 축 (항상 반영)
  ========================================================= */

  const isLowerReversal =
    bollingerSignal ===
      BollingerSignalType.OUTSIDE_LOWER_CROSS_UP_OVER_LOWER ||
    bollingerSignal ===
      BollingerSignalType.OUTSIDE_LOWER_RETURN_INSIDE

  const isUpperReversal =
    bollingerSignal ===
      BollingerSignalType.OUTSIDE_UPPER_RETRACE_OVER_UPPER ||
    bollingerSignal ===
      BollingerSignalType.OUTSIDE_UPPER_RETURN_INSIDE

  const isTakeProfitLong =
    bollingerSignal ===
      BollingerSignalType.INSIDE_UPPER_CLOSE_ABOVE

  const isTakeProfitShort =
    bollingerSignal ===
      BollingerSignalType.INSIDE_LOWER_CLOSE_BELOW

  /* =========================================================
     2️⃣ MACD
  ========================================================= */

  const macdGolden = macd?.cross === 'GOLDEN'
  const macdDead = macd?.cross === 'DEAD'

  /* =========================================================
     3️⃣ Institutional Probability
  ========================================================= */

  const { confidence, dominant } = probability
  const strongConfidence = confidence >= 55
  const extremeBoost = confidence >= 45

  /* =========================================================
     4️⃣ FMAI (Store 기반 통합)
  ========================================================= */

  const fmaiStrongLong =
    effectiveFMAI?.direction === 'STRONG_LONG'

  const fmaiStrongShort =
    effectiveFMAI?.direction === 'STRONG_SHORT'

  /* =========================================================
     🔥 Long 트리
  ========================================================= */

  if (isLowerReversal) {

    if (fmaiStrongLong && extremeBoost) {
      return 'EXTREME_LONG'
    }

    if (macdGolden) {
      return 'LONG_ENTRY'
    }

    if (!macdGolden && strongConfidence && dominant === 'LONG') {
      return 'LONG_ENTRY'
    }

    return 'HOLD_LONG'
  }

  /* =========================================================
     🔥 Short 트리
  ========================================================= */

  if (isUpperReversal) {

    if (fmaiStrongShort && extremeBoost) {
      return 'EXTREME_SHORT'
    }

    if (macdDead) {
      return 'SHORT_ENTRY'
    }

    if (!macdDead && strongConfidence && dominant === 'SHORT') {
      return 'SHORT_ENTRY'
    }

    return 'HOLD_SHORT'
  }

  /* =========================================================
     5️⃣ 이익 실현
  ========================================================= */

  if (isTakeProfitLong) {
    return 'TAKE_PROFIT_LONG'
  }

  if (isTakeProfitShort) {
    return 'TAKE_PROFIT_SHORT'
  }

  /* =========================================================
     6️⃣ Bollinger 없을 때 Probability 독립 판단 허용
  ========================================================= */

  if (!bollingerSignal && strongConfidence) {
    if (dominant === 'LONG') return 'LONG_ENTRY'
    if (dominant === 'SHORT') return 'SHORT_ENTRY'
  }

  /* =========================================================
     7️⃣ Gate는 약화 전용 (차단 제거)
  ========================================================= */

  if (actionGateState === 'CAUTION') {
    if (dominant === 'LONG') return 'REDUCE_LONG'
    if (dominant === 'SHORT') return 'REDUCE_SHORT'
  }

  /* =========================================================
     8️⃣ 기본 유지
  ========================================================= */

  if (dominant === 'LONG') return 'HOLD_LONG'
  if (dominant === 'SHORT') return 'HOLD_SHORT'

  return 'WAIT'
}
