import { handlePriceTick } from '../lib/poller/alertEngine.poller.js'
import { redis } from '../lib/redis/index.js'

const SYMBOL = 'BTCUSDT'
const INTERVAL_MS = 3000

let lastPrice: number | null = null

console.log('[POLLER] started:', SYMBOL)

setInterval(async () => {
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${SYMBOL}`
    )

    if (!res.ok) return

    const data = await res.json()
    const price = Number(data?.price)

    if (!Number.isFinite(price)) return
    if (price === lastPrice) return
    lastPrice = price

    console.log('[POLLING]', SYMBOL, price)

    await handlePriceTick({ symbol: SYMBOL, price })

    await redis.publish(
  'realtime:market', // ✅ SSE Hub가 실제로 subscribe 중
  JSON.stringify({
    type: 'PRICE_TICK',
    symbol: SYMBOL,
    price,
    ts: Date.now(),
  })
)

  } catch (e) {
    console.error('[POLLER ERROR]', e)
  }
}, INTERVAL_MS)
