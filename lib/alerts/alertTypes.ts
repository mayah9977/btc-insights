//lib/alerts/alertTypes.ts

/* =========================
 * Alert Condition
 * ========================= */
export type AlertCondition =
  | 'ABOVE'
  | 'BELOW'
  | 'REACH'
  | 'PERCENT_UP'
  | 'PERCENT_DOWN'
  | 'RSI_OVER'
  | 'RSI_UNDER'

/* =========================
 * Alert Status (SSOT)
 * ========================= */
export type AlertStatus =
  | 'WAITING'        // 대기
  | 'TRIGGERED'      // 조건 충족 완료
  | 'DISABLED'       // 수동 비활성

/* =========================
 * Repeat Mode
 * ========================= */
export type AlertRepeatMode =
  | 'ONCE'
  | 'REPEAT'

/* =========================
 * Price Alert (Core Domain)
 * 👉 Client / Server / Engine 공통
 * ========================= */
export type PriceAlert = {
  /* identity */
  id: string
  userId: string
  exchange: 'BINANCE'
  symbol: string

  /* condition */
  condition: AlertCondition
  targetPrice?: number
  basePrice?: number
  percent?: number
  trailingPercent?: number
  rsi?: number

  /* ✅ STATE (SSOT) */
  status: AlertStatus
  repeatMode: AlertRepeatMode
  cooldownMs?: number
  lastTriggeredAt?: number

  /* meta */
  memo?: string
  createdAt: number
}
