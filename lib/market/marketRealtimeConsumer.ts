import { createRedisSubscriber } from '@/lib/redis'
import { updateOI } from '@/lib/market/pricePolling'

import {
  loadAllWhaleIntensityKeys,
  loadWhaleIntensityHistory,
} from '@/lib/market/whaleRedisStore'

import {
  setWhaleIntensityHistory,
} from '@/lib/market/pricePolling'

/* =========================
 * 🔥 Server Boot: Redis → Memory Hydration
 * ========================= */
;(async () => {
  try {
    const symbols = await loadAllWhaleIntensityKeys()

    for (const symbol of symbols) {
      const history = await loadWhaleIntensityHistory(symbol)
      if (history.length > 0) {
        setWhaleIntensityHistory(symbol, history)
      }
    }

    if (symbols.length > 0) {
      console.log(
        `[MARKET CONSUMER] whaleIntensity hydrated (${symbols.length} symbols)`,
      )
    }
  } catch (e) {
    console.error(
      '[MARKET CONSUMER] whaleIntensity hydrate failed',
      e,
    )
  }
})()

/* =========================
 * 🔥 Redis Realtime Consumer
 * ========================= */

const sub = createRedisSubscriber()

console.log('[MARKET CONSUMER] started')

sub.subscribe('realtime:market')

sub.on('message', (_channel, raw) => {
  try {
    const event = JSON.parse(raw)

    /* ✅ OI만 캐시 */
    if (event.type === 'OI_TICK') {
      updateOI(event.symbol, event.openInterest)
    }

    /**
     * ⚠️ VOLUME_TICK 처리 제거
     * - Volume은 pricePolling 내부에서 계산
     * - Redis publish → SSE 단방향 흐름만 유지
     */
  } catch (e) {
    console.error('[MARKET CONSUMER] parse error', e)
  }
})
