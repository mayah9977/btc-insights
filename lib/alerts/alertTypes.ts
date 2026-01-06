/* =========================
 * Alert Condition
 * ========================= */
export type AlertCondition =
  | 'ABOVE'          // 가격 이상 상승
  | 'BELOW'          // 가격 이하 하락
  | 'REACH'          // 정확히 도달
  | 'PERCENT_UP'     // % 이상 상승
  | 'PERCENT_DOWN'   // % 이상 하락
  | 'RSI_OVER'       // RSI 과열 (※ 현재 미사용, 확장용)
  | 'RSI_UNDER'      // RSI 과매도 (※ 현재 미사용, 확장용)

/* =========================
 * Alert Status
 * ========================= */
export type AlertStatus =
  | 'WAITING'
  | 'TRIGGERED'
  | 'DISABLED'

/* =========================
 * Repeat Mode
 * ========================= */
export type AlertRepeatMode =
  | 'ONCE'
  | 'REPEAT'

/* =========================
 * Price Alert
 * ========================= */
export type PriceAlert = {
  /* =========================
   * Identity
   * ========================= */
  id: string
  userId: string
  exchange: 'BINANCE'
  symbol: string               // BTCUSDT

  /* =========================
   * Condition
   * ========================= */
  condition: AlertCondition

  // 가격 기반
  targetPrice?: number         // ABOVE / BELOW / REACH

  // % 기반
  basePrice?: number           // 기준 가격
  percent?: number             // 변동 %

  // RSI 기반 (현재 UI/엔진에서는 사용 안 함)
  rsi?: number                 // 70 / 30 등

  /* =========================
   * State
   * ========================= */
  status: AlertStatus          // WAITING / TRIGGERED / DISABLED
  repeatMode: AlertRepeatMode
  cooldownMs?: number
  lastTriggeredAt?: number

  /* =========================
   * Meta
   * ========================= */
  memo?: string
  createdAt: number
}
