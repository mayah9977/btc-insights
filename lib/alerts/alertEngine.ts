import {
  getActiveAlerts,
  markAlertTriggered,
  updateAlert,
} from './alertStore.server'

import type { PriceAlert } from './alertTypes'

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
  mode?: 'tick' | 'initial' | 'realtime'
}

/**
 * 심볼 단위 동시 처리 방지
 */
const processing = new Set<string>()

/* =========================
 * 🔔 Alert Engine Core (SSOT)
 * ========================= */
export async function handlePriceTick(tick: PriceTick) {
  const symbol = String(tick.symbol ?? '').toUpperCase()
  const price = Number(tick.price)
  const mode = tick.mode ?? 'tick'

  if (!symbol || !Number.isFinite(price)) return
  if (processing.has(symbol)) return

  processing.add(symbol)

  try {
    // ✅ 엔진 평가는 status === 'WAITING' 인 알림만
    const alerts: PriceAlert[] = await getActiveAlerts(symbol)
    if (!alerts.length) return

    for (const alert of alerts) {
      const cooldownMs = alert.cooldownMs ?? 0

      /* =========================
       * ⏱ Cooldown (REPEAT)
       * ========================= */
      if (
        mode === 'tick' &&
        alert.repeatMode === 'REPEAT' &&
        cooldownMs > 0 &&
        alert.lastTriggeredAt &&
        Date.now() - alert.lastTriggeredAt < cooldownMs
      ) {
        continue
      }

      const basePrice =
        typeof alert.basePrice === 'number'
          ? alert.basePrice
          : price

      let hit = false

      /* =========================
       * 📈 Price-based
       * ========================= */
      if (
        alert.condition === 'ABOVE' &&
        typeof alert.targetPrice === 'number'
      ) {
        hit = price >= alert.targetPrice
      }

      if (
        alert.condition === 'BELOW' &&
        typeof alert.targetPrice === 'number'
      ) {
        hit = price <= alert.targetPrice
      }

      if (
        alert.condition === 'REACH' &&
        typeof alert.targetPrice === 'number'
      ) {
        hit = price === alert.targetPrice
      }

      /* =========================
       * 📊 Percent-based
       * ========================= */
      if (
        alert.condition === 'PERCENT_UP' &&
        typeof alert.percent === 'number' &&
        basePrice > 0
      ) {
        const change = ((price - basePrice) / basePrice) * 100
        hit = change >= alert.percent
      }

      if (
        alert.condition === 'PERCENT_DOWN' &&
        typeof alert.percent === 'number' &&
        basePrice > 0
      ) {
        const change = ((basePrice - price) / basePrice) * 100
        hit = change >= alert.percent
      }

      if (!hit) continue

      const ts = Date.now()
      console.log('[ENGINE][HIT]', alert.id, symbol, price, mode)

      /* =========================
       * 🔔 External Notification
       * ========================= */
      await sendAlertNotification(alert, price)

      /* =========================
       * 📜 History
       * ========================= */
      await addAlertHistory({
        alertId: alert.id,
        userId: alert.userId,
        symbol: alert.symbol,
        condition: alert.condition,
        price,
        basePrice,
        percent:
          alert.percent ??
          ((price - basePrice) / basePrice) * 100,
      })

      /* =========================
       * 🔁 Alert State Update (SSOT)
       * ========================= */
      if (alert.repeatMode === 'REPEAT') {
        // 🔁 반복 알림은 상태를 WAITING 유지
        await updateAlert(alert.id, {
          status: 'WAITING',
          lastTriggeredAt: ts,
          basePrice:
            typeof alert.basePrice === 'number'
              ? alert.basePrice
              : price,
        })
      } else {
        // ✅ 1회성 알림은 TRIGGERED 로 종료
        await markAlertTriggered(alert.id)
      }

      /* =========================
       * 🔥 Redis → SSE
       * ========================= */
      await redis.publish(
        'realtime:market',
        JSON.stringify({
          type: 'ALERT_TRIGGERED',
          alertId: alert.id,
          userId: alert.userId,
          symbol: alert.symbol,
          price,
          ts,
        }),
      )

      /* =========================
       * 🔥 FCM Push
       * ========================= */
      await pushAlertTriggered({
        userId: alert.userId,
        alertId: alert.id,
        symbol: alert.symbol,
        price,
        ts,
      })
    }
  } catch (e) {
    console.error('[ALERT_ENGINE]', e)
  } finally {
    processing.delete(symbol)
  }
}
