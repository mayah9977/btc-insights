/** 
 * BollingerSignalType (Action Gate v2)
 *
 * 원칙:
 * - ❌ 매수 / 매도 / 지시 / 판단 아님
 * - ⭕ "BTC 30분 봉과 Bollinger Band의 위치 관계"를 라벨링
 *
 * 이 enum은 다음에서 SSOT로 사용됨:
 * - lib/market/evaluateRealtimeBollinger.ts
 * - lib/market/evaluateConfirmedBollinger.ts
 * - components/realtime/BBSignalCard.tsx
 * - lib/market/actionGate/bollingerSentenceMap.ts
 */

export enum BollingerSignalType {
  /* =====================================================
   * Upper Band (1 ~ 5)
   * ===================================================== */

  INSIDE_UPPER_TOUCH = 'INSIDE_UPPER_TOUCH',                         // 1
  INSIDE_UPPER_CLOSE_ABOVE = 'INSIDE_UPPER_CLOSE_ABOVE',             // 2
  INSIDE_UPPER_BREAK_AND_DEVIATE = 'INSIDE_UPPER_BREAK_AND_DEVIATE', // 3
  OUTSIDE_UPPER_RETRACE_OVER_UPPER = 'OUTSIDE_UPPER_RETRACE_OVER_UPPER', // 4
  OUTSIDE_UPPER_RETURN_INSIDE = 'OUTSIDE_UPPER_RETURN_INSIDE',       // 5

  /* =====================================================
   * Lower Band (6 ~ 11)
   * ===================================================== */

  INSIDE_LOWER_TOUCH_OR_BREAK = 'INSIDE_LOWER_TOUCH_OR_BREAK',       // 6
  INSIDE_LOWER_TOUCH_AND_REBOUND = 'INSIDE_LOWER_TOUCH_AND_REBOUND', // 7
  INSIDE_LOWER_CLOSE_BELOW = 'INSIDE_LOWER_CLOSE_BELOW',             // 8
  INSIDE_LOWER_BREAK_AND_DEVIATE = 'INSIDE_LOWER_BREAK_AND_DEVIATE', // 9
  OUTSIDE_LOWER_CROSS_UP_OVER_LOWER = 'OUTSIDE_LOWER_CROSS_UP_OVER_LOWER', // 10
  OUTSIDE_LOWER_RETURN_INSIDE = 'OUTSIDE_LOWER_RETURN_INSIDE',       // 11

  /* =====================================================
   * Center Band (12)
   * ===================================================== */

  INSIDE_CENTER = 'INSIDE_CENTER', // 12 (완전 내부, wick 미접촉)
}

/* =====================================================
 * BTC 30분 봉 OHLC 스냅샷
 * ===================================================== */

export type Candle30m = {
  openTime: number // ms
  closeTime: number // ms
  open: number
  high: number
  low: number
  close: number
}

/* =====================================================
 * Bollinger Bands (30m 기준)
 * ===================================================== */

export type BollingerBands30m = {
  upperBand: number
  lowerBand: number
  upperSlope?: number
  lowerSlope?: number
}

/* =====================================================
 * Realtime / Confirmed 공통 Signal 구조
 * ===================================================== */

export type BollingerSignal = {
  enabled: true
  timeframe: '30m'
  symbol: string
  signalType: BollingerSignalType

  candle: Candle30m
  bands: BollingerBands30m

  /**
   * 확정 여부 (UI 의미)
   * - true  : 30분 봉 closeTime 경과 → 확정 봉
   * - false : 진행 중 봉
   */
  confirmed: boolean

  /** 생성 시각 (ms) */
  at: number
}
