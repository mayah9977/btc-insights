import {
  getActiveAlerts,
  markAlertTriggered,
  updateAlert,
  type PriceAlert,
} from './alertStore.server'
import { sendAlertNotification } from './alertNotifier'
import { addAlertHistory } from './alertHistoryStore'
import { redis } from '../redis'
import { pushAlertTriggered } from '@/lib/push/pushOnAlert'

/* =========================
 * Types
 * ========================= */
export type PriceTick = {
  symbol: string
  price: number
  mode?: 'tick' | 'initial'
}

/** 심볼 단위 중복 방지 (동시 tick 보호) */
const processing = new Set<string>()

/* =========================
 * 🔔 Alert Engine Core
 * ========================= */
export async function handlePriceTick(tick: PriceTick) {
  const symbol = tick.symbol.toUpperCase()
  const mode = tick.mode ?? 'tick'

  if (processing.has(symbol)) return
  processing.add(symbol)

  try {
    const alerts: PriceAlert[] = await getActiveAlerts(symbol)
    if (!alerts.length) return

    for (const alert of alerts) {
      /* =========================
       * 🔒 Guard
       * ========================= */
      if (!alert?.id) continue
      if (!alert.enabled) continue
      if (alert.repeatMode === 'ONCE' && alert.triggered) continue

      /* =========================
       * ⏱ Cooldown (REPEAT)
       * ========================= */
      if (
        mode === 'tick' &&
        alert.repeatMode === 'REPEAT' &&
        alert.cooldownMs &&
        alert.lastTriggeredAt &&
        Date.now() - alert.lastTriggeredAt < alert.cooldownMs
      ) {
        continue
      }

      const basePrice = alert.basePrice ?? tick.price
      let hit = false

      /* =========================
       * 📈 Price-based
       * ========================= */
      if (
        alert.condition === 'ABOVE' &&
        typeof alert.targetPrice === 'number'
      ) {
        hit = tick.price >= alert.targetPrice
      }

      if (
        alert.condition === 'BELOW' &&
        typeof alert.targetPrice === 'number'
      ) {
        hit = tick.price <= alert.targetPrice
      }

      /* =========================
       * 📊 Percent-based
       * ========================= */
      if (
        alert.condition === 'PERCENT_UP' &&
        typeof alert.percent === 'number'
      ) {
        const change =
          ((tick.price - basePrice) / basePrice) * 100
        hit = change >= alert.percent
      }

      if (
        alert.condition === 'PERCENT_DOWN' &&
        typeof alert.percent === 'number'
      ) {
        const change =
          ((basePrice - tick.price) / basePrice) * 100
        hit = change >= alert.percent
      }

      if (!hit) continue

      const ts = Date.now()

      /* =========================
       * 🔔 External Notification
       * ========================= */
      await sendAlertNotification(alert, tick.price)

      /* =========================
       * 📜 History
       * ========================= */
      await addAlertHistory({
        alertId: alert.id,
        userId: alert.userId,
        symbol: alert.symbol,
        condition: alert.condition,
        price: tick.price,
        basePrice,
        percent:
          alert.percent ??
          ((tick.price - basePrice) / basePrice) * 100,
      })

      /* =========================
       * 🔁 Alert State Update
       * ========================= */
      if (alert.repeatMode === 'REPEAT' && alert.trailingPercent) {
        await updateAlert(alert.id, {
          basePrice: tick.price,
          lastTriggeredAt: ts,
        })
      } else {
        await markAlertTriggered(alert.id)
      }

      /* =========================
       * 🔥 Redis Event (SSE fan-out)
       * ========================= */
      await redis.publish(
        'realtime',
        JSON.stringify({
          type: 'ALERT_TRIGGERED',
          alertId: alert.id,
          userId: alert.userId,
          symbol: alert.symbol,
          price: tick.price,
          ts,
        }),
      )

      /* =========================
       * 🔥 FCM PUSH (User target)
       * ========================= */
      await pushAlertTriggered({
        userId: alert.userId,
        alertId: alert.id,
        symbol: alert.symbol,
        price: tick.price,
        ts,
      })
    }
  } catch (e) {
    console.error('[ALERT_ENGINE]', e)
  } finally {
    processing.delete(symbol)
  }
}
