import { BollingerSignalType } from '@/lib/market/actionGate/signalType'
import type { BollingerSignalInput } from './bollingerSignal'

export type RealtimeBollingerResult =
  | { enabled: true; signalType: BollingerSignalType }
  | { enabled: false }

export function evaluateRealtimeBollinger(
  input: BollingerSignalInput,
): RealtimeBollingerResult {
  const {
    open,
    high,
    low,
    close,
    upperBand,
    lowerBand,
    prevSignalType,
  } = input

  /* ==========================================================
   * 0️⃣ Numeric Guard
   * ========================================================== */
  if (
    !Number.isFinite(close) ||
    !Number.isFinite(upperBand) ||
    !Number.isFinite(lowerBand)
  ) {
    return { enabled: false }
  }

  const isBullish = close > open
  const isBearish = close < open

  const closeAbove = close > upperBand
  const closeBelow = close < lowerBand
  const closeInside =
    close <= upperBand && close >= lowerBand

  // 🔥 CROSS 계산용
  const body = Math.abs(close - open)
  const range = Math.max(high - low, 0.0000001)
  const bodyRatio = body / range

  const prevLowerOutside =
    prevSignalType ===
      BollingerSignalType.INSIDE_LOWER_CLOSE_BELOW ||
    prevSignalType ===
      BollingerSignalType.INSIDE_LOWER_BREAK_AND_DEVIATE

  const prevUpperOutside =
    prevSignalType ===
      BollingerSignalType.INSIDE_UPPER_CLOSE_ABOVE ||
    prevSignalType ===
      BollingerSignalType.INSIDE_UPPER_BREAK_AND_DEVIATE ||
    prevSignalType ===
      BollingerSignalType.OUTSIDE_UPPER_RETRACE_OVER_UPPER

  /* ==========================================================
   * 1️⃣ Upper Outside 영역
   * ========================================================== */
  if (closeAbove) {
    if (low > upperBand) {
      return {
        enabled: true,
        signalType:
          BollingerSignalType.INSIDE_UPPER_BREAK_AND_DEVIATE,
      }
    }

    return {
      enabled: true,
      signalType:
        BollingerSignalType.OUTSIDE_UPPER_RETRACE_OVER_UPPER,
    }
  }

  /* ==========================================================
   * 2️⃣ Lower Outside 영역
   * ========================================================== */
  if (closeBelow) {
    if (high < lowerBand) {
      return {
        enabled: true,
        signalType:
          BollingerSignalType.INSIDE_LOWER_BREAK_AND_DEVIATE,
      }
    }

    return {
      enabled: true,
      signalType:
        BollingerSignalType.INSIDE_LOWER_CLOSE_BELOW,
    }
  }

  /* ==========================================================
   * 3️⃣ Inside 영역
   * ========================================================== */
  if (closeInside) {

    /* ----------------------------------------------------------
     * 3-1️⃣ Upper RETURN
     * ---------------------------------------------------------- */
    if (prevUpperOutside) {
      return {
        enabled: true,
        signalType:
          BollingerSignalType.OUTSIDE_UPPER_RETURN_INSIDE,
      }
    }

    /* ----------------------------------------------------------
     * 3-2️⃣ CROSS(10)
     * ---------------------------------------------------------- */
    if (
      prevLowerOutside &&
      close >= lowerBand &&
      isBullish &&
      bodyRatio >= 0.5
    ) {
      return {
        enabled: true,
        signalType:
          BollingerSignalType.OUTSIDE_LOWER_CROSS_UP_OVER_LOWER,
      }
    }

    /* ----------------------------------------------------------
     * 3-3️⃣ Lower RETURN
     * ---------------------------------------------------------- */
    if (prevLowerOutside) {
      return {
        enabled: true,
        signalType:
          BollingerSignalType.OUTSIDE_LOWER_RETURN_INSIDE,
      }
    }

    /* ----------------------------------------------------------
     * 3-4️⃣ 6번: 급락 감지 (Realtime 전용)
     * ---------------------------------------------------------- */
    if (isBearish && low <= lowerBand) {
      return {
        enabled: true,
        signalType:
          BollingerSignalType.INSIDE_LOWER_TOUCH_OR_BREAK,
      }
    }

    /* ----------------------------------------------------------
     * 3-5️⃣ 7번: 하단 터치 후 반등
     * ---------------------------------------------------------- */
    if (isBullish && low <= lowerBand) {
      return {
        enabled: true,
        signalType:
          BollingerSignalType.INSIDE_LOWER_TOUCH_AND_REBOUND,
      }
    }

    /* ----------------------------------------------------------
     * 3-6️⃣ Upper 터치
     * ---------------------------------------------------------- */
    if (high >= upperBand) {
      return {
        enabled: true,
        signalType:
          BollingerSignalType.INSIDE_UPPER_TOUCH,
      }
    }

    /* ----------------------------------------------------------
     * 3-7️⃣ 🔥 INSIDE_CENTER 수학적 고정
     * 중앙 30% 구간만 CENTER 허용
     * ---------------------------------------------------------- */

    const bandWidth = upperBand - lowerBand
    const positionRatio =
      (close - lowerBand) / Math.max(bandWidth, 0.0000001)

    if (positionRatio >= 0.35 && positionRatio <= 0.65) {
      return {
        enabled: true,
        signalType:
          BollingerSignalType.INSIDE_CENTER,
      }
    }

    // 중앙 밖은 상/하단 구조로 흡수
    if (positionRatio > 0.65) {
      return {
        enabled: true,
        signalType:
          BollingerSignalType.INSIDE_UPPER_TOUCH,
      }
    }

    return {
      enabled: true,
      signalType:
        BollingerSignalType.INSIDE_LOWER_TOUCH_OR_BREAK,
    }
  }

  /* ==========================================================
   * 4️⃣ Fallback
   * ========================================================== */
  return {
    enabled: true,
    signalType:
      BollingerSignalType.INSIDE_CENTER,
  }
}
