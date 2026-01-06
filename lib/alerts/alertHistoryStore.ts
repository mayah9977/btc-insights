import type { AlertCondition } from './alertTypes'

/* =========================
 * Alert History Type
 * ========================= */
export type AlertHistory = {
  id: string
  alertId: string
  userId: string

  symbol: string
  condition: AlertCondition

  /* 기존 가격 기반 */
  price: number

  /* % / 트레일링 기반 확장 */
  basePrice?: number        // 기준가
  triggerPrice?: number     // 트리거 시점 가격
  percent?: number          // 변동 %

  /* 기존 RSI 호환 */
  rsi?: number

  triggeredAt: number
}

/* =========================
 * In-memory History Store
 * ⚠️ 실제 서비스에서는 DB / Redis 권장
 * ========================= */
const histories: AlertHistory[] = []

/* =========================
 * Add History
 * ========================= */
export async function addAlertHistory(
  input: Omit<AlertHistory, 'id' | 'triggeredAt'>
) {
  const history: AlertHistory = {
    id: crypto.randomUUID(),
    triggeredAt: Date.now(),
    ...input,
  }

  histories.push(history)
  return history
}

/* =========================
 * List Histories (User)
 * ========================= */
export async function listAlertHistories(userId: string) {
  return histories
    .filter(h => h.userId === userId)
    .sort((a, b) => b.triggeredAt - a.triggeredAt)
}

/* =========================
 * (Optional) Stats / Performance
 * ========================= */
export async function getAlertPerformance(userId: string) {
  const userHistories = histories.filter(h => h.userId === userId)

  const total = userHistories.length
  const avgPercent =
    userHistories.reduce((sum, h) => sum + (h.percent ?? 0), 0) /
    (total || 1)

  return {
    totalTriggers: total,
    averagePercent: Number(avgPercent.toFixed(2)),
  }
}
