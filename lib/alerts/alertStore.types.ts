//lib/alerts/alertStore.type.ts

/* =========================
 * Alert Condition
 * ========================= */
export type AlertCondition =
  | 'ABOVE'          // 목표가 이상
  | 'BELOW'          // 목표가 이하
  | 'REACH'          // 정확히 도달
  | 'PERCENT_UP'     // 기준가 대비 % 상승
  | 'PERCENT_DOWN'   // 기준가 대비 % 하락
  | 'RSI_OVER'       // RSI 과열 (확장용)
  | 'RSI_UNDER'      // RSI 과매도 (확장용)

/* =========================
 * Repeat Mode
 * ========================= */
export type RepeatMode = 'ONCE' | 'REPEAT'

/* =========================
 * Alert Status (SSOT)
 * ========================= */
export type AlertStatus =
  | 'WAITING'        // 대기
  | 'TRIGGERED'      // 트리거 완료
  | 'DISABLED'       // 사용자 비활성

/* =========================
 * Price Alert (SSOT)
 * 👉 Client / Server / Engine 공통
 * ========================= */
export type PriceAlert = {
  /* =========================
   * Identity
   * ========================= */
  id: string
  userId: string
  exchange: 'BINANCE'
  symbol: string

  /* =========================
   * Condition
   * ========================= */
  condition: AlertCondition

  // 🔹 절대값 기반
  targetPrice?: number

  // 🔹 퍼센트 기반
  basePrice?: number
  percent?: number

  // 🔹 RSI (확장용)
  rsi?: number

  /* =========================
   * State (SSOT 핵심)
   * ========================= */
  status: AlertStatus          // ✅ 유일한 상태 기준
  repeatMode: RepeatMode
  cooldownMs?: number
  lastTriggeredAt?: number

  /* =========================
   * Meta
   * ========================= */
  createdAt: number
  memo?: string
}
