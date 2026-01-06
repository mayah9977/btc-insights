// lib/market/pricePolling.ts
import { handlePriceTick } from '@/lib/alerts/alertEngine'
import { redis, createRedisSubscriber } from '@/lib/redis'

/* =========================
 * Internal State
 * ========================= */

/**
 * 🔥 마지막 가격 캐시 (symbol 단위)
 * - realtime:market 채널을 구독해서 PRICE_TICK을 받아 lastPriceMap을 채움
 * - 알림 저장 직후 pushPriceTick()에서 즉시 평가에 사용
 */
const lastPriceMap: Record<string, number> = {}

/* =========================
 * (옵션) 외부에서 가격 주입
 * - admin / backfill / test 용
 * ========================= */
export function cacheLastPrice(symbol: string, price: number) {
  lastPriceMap[symbol.toUpperCase()] = price
}

/* =========================
 * ✅ Price polling(캐시 채움) bootstrap
 * - app/api/_init 에서 1회 호출
 * - 중복 구독 방지
 * ========================= */
let started = false

export function ensurePricePollingStarted() {
  if (started) return
  started = true

  const sub = createRedisSubscriber()

  sub.subscribe('realtime:market', (err) => {
    if (err) {
      console.error('[PRICE_POLLING] subscribe failed', err)
    } else {
      console.log('[PRICE_POLLING] subscribed: realtime:market')
    }
  })

  sub.on('message', (_channel, message) => {
    // message는 SSE Hub에서도 그대로 data로 보내는 payload라 가정 (JSON)
    try {
      const data = JSON.parse(message)

      // ✅ PRICE_TICK 수신 시 캐시 업데이트
      if (data?.type === 'PRICE_TICK') {
        const symbol = String(data.symbol ?? '').toUpperCase()
        const price = Number(data.price)

        if (symbol && Number.isFinite(price)) {
          lastPriceMap[symbol] = price
        }
      }
    } catch {
      // JSON이 아니면 무시
    }
  })
}

/* =========================
 * 🔥 알림 저장 직후 강제 평가
 * ========================= */
export async function pushPriceTick(params: { symbol: string; reason?: string }) {
  const symbol = params.symbol.toUpperCase()
  const price = lastPriceMap[symbol]

  if (!Number.isFinite(price)) {
    console.warn('[FORCE_TICK] no cached price', symbol)
    return
  }

  console.log('[FORCE_TICK]', symbol, price, params.reason)

  /* =========================
   * 🔔 ALERT ENGINE 즉시 평가
   * ========================= */
  await handlePriceTick({
    symbol,
    price,
    mode: 'initial',
  })

  /* =========================
   * 🔥 Redis Event (단발)
   * - SSE Hub가 구독하는 채널과 통일: realtime:market
   * ========================= */
  await redis.publish(
    'realtime:market',
    JSON.stringify({
      type: 'PRICE_FORCE',
      symbol,
      price,
      ts: Date.now(),
      reason: params.reason,
    }),
  )
}
