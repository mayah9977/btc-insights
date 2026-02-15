/* ======================================================
 * Bollinger Structure Classifier (Action Gate v2)
 * Timeframe: BTC 30m Candle (CLOSE 기준)
 *
 * ⚠️ Role
 * - Bollinger Bands 기반 "구조 라벨링"
 * - 해석 ❌ / 판단 ❌ / 신호 ❌
 * - Action Gate 문장 매핑용 SSOT 입력만 제공
 * ======================================================
 */

import { BollingerSignalType } from '@/lib/market/actionGate/signalType'

/* -----------------------------
 * Input / Output Types
 * ----------------------------- */

export type BollingerSignalInput = {
  open: number
  high: number
  low: number
  close: number

  upperBand: number
  lowerBand: number

  // 🔥 Prev 구조 상태 (Option A 도입)
  prevSignalType?: BollingerSignalType

  // (레거시 유지용 - 현재 구조에서는 사용 안 함)
  upperSlope?: number
  lowerSlope?: number
}

export type BollingerSignalResult =
  | {
      enabled: true
      signalType: BollingerSignalType
    }
  | {
      enabled: false
    }

/* -----------------------------
 * Core Evaluator (Legacy SSOT)
 * ⚠ 현재 구조에서는 evaluateRealtime / evaluateConfirmed 사용
 * ----------------------------- */

export function evaluateBollingerSignal(
  input: BollingerSignalInput,
): BollingerSignalResult {
  const {
    open,
    high,
    low,
    close,
    upperBand,
    lowerBand,
  } = input

  if (
    !Number.isFinite(open) ||
    !Number.isFinite(high) ||
    !Number.isFinite(low) ||
    !Number.isFinite(close) ||
    !Number.isFinite(upperBand) ||
    !Number.isFinite(lowerBand)
  ) {
    return { enabled: false }
  }

  const isBullish = close > open
  const isBearish = close < open

  const closeInside = close <= upperBand && close >= lowerBand
  const closeAbove = close > upperBand
  const closeBelow = close < lowerBand

  /* ==================================================
   * Upper Band (1 ~ 5)
   * ================================================== */

  if (isBullish && high >= upperBand && closeInside) {
    return {
      enabled: true,
      signalType: BollingerSignalType.INSIDE_UPPER_TOUCH,
    }
  }

  if (isBullish && open < upperBand && closeAbove) {
    return {
      enabled: true,
      signalType: BollingerSignalType.INSIDE_UPPER_CLOSE_ABOVE,
    }
  }

  if (isBullish && low > upperBand && closeAbove) {
    return {
      enabled: true,
      signalType:
        BollingerSignalType.INSIDE_UPPER_BREAK_AND_DEVIATE,
    }
  }

  if (isBearish && open > upperBand && closeAbove) {
    return {
      enabled: true,
      signalType:
        BollingerSignalType.OUTSIDE_UPPER_RETRACE_OVER_UPPER,
    }
  }

  if (open > upperBand && closeInside) {
    return {
      enabled: true,
      signalType:
        BollingerSignalType.OUTSIDE_UPPER_RETURN_INSIDE,
    }
  }

  /* ==================================================
   * Lower Band (6 ~ 11)
   * ================================================== */

  if (isBearish && low <= lowerBand && closeInside) {
    return {
      enabled: true,
      signalType:
        BollingerSignalType.INSIDE_LOWER_TOUCH_OR_BREAK,
    }
  }

  if (isBullish && low <= lowerBand && closeInside) {
    return {
      enabled: true,
      signalType:
        BollingerSignalType.INSIDE_LOWER_TOUCH_AND_REBOUND,
    }
  }

  if (isBearish && open >= lowerBand && closeBelow) {
    return {
      enabled: true,
      signalType:
        BollingerSignalType.INSIDE_LOWER_CLOSE_BELOW,
    }
  }

  if (isBearish && high < lowerBand && closeBelow) {
    return {
      enabled: true,
      signalType:
        BollingerSignalType.INSIDE_LOWER_BREAK_AND_DEVIATE,
    }
  }

  /* ==================================================
   * Center (12)
   * ================================================== */

  if (closeInside) {
    return {
      enabled: true,
      signalType: BollingerSignalType.INSIDE_CENTER,
    }
  }

  return { enabled: false }
}

/* -----------------------------
 * Legacy entry point
 * ----------------------------- */

export function getBollingerSignal(
  input: BollingerSignalInput,
): BollingerSignalResult {
  return evaluateBollingerSignal(input)
}
