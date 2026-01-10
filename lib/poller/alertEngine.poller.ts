import { getActiveAlerts, markAlertTriggered } from '../alerts/alertStore.server'
import { redis } from '../redis/index.js'

/**
 * =========================
 * Poller 전용 Alert Engine
 * =========================
 * - push / firebase / fcm ❌
 * - Redis publish만 수행
 * - 단발성 알림 (ONCE)
 */
export async function handlePriceTick(params: {
  symbol: string
  price: number
}) {
  const symbol = params.symbol.toUpperCase()
  const price = params.price

  // 활성 알림 조회
  const alerts = await getActiveAlerts(symbol)
  if (!alerts || alerts.length === 0) return

  for (const alert of alerts) {
    // 비활성 / 이미 트리거된 알림 제외
    if (alert.status !== 'WAITING') continue

    // targetPrice 없는 알림 제외
    if (typeof alert.targetPrice !== 'number') continue

    let hit = false

    if (alert.condition === 'ABOVE') {
      hit = price >= alert.targetPrice
    } else if (alert.condition === 'BELOW') {
      hit = price <= alert.targetPrice
    }

    if (!hit) continue

    /**
     * =========================
     * 상태 업데이트 (단발)
     * =========================
     */
    await markAlertTriggered(alert.id)

    /**
     * =========================
     * Redis realtime event
     * (poller → SSE server)
     * =========================
     */
    await redis.publish(
      'realtime',
      JSON.stringify({
        type: 'ALERT_TRIGGERED',
        alertId: alert.id,
        symbol,
        price,
        condition: alert.condition,
        targetPrice: alert.targetPrice,
        ts: Date.now(),
      })
    )
  }
}
