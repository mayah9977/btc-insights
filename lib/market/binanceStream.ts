import WebSocket from 'ws'
import { onPriceUpdate } from './pricePolling'
import { redis } from '@/lib/redis'
import {
  getLastOI,
  getPrevOI,
  getLastVolume,
  getPrevVolume,
} from '@/lib/market/marketLastStateStore'
import { calcWhaleIntensity } from '@/lib/ai/calcWhaleIntensity'
import { saveWhaleIntensity } from '@/lib/market/whaleRedisStore'

const SYMBOL = 'BTCUSDT'
const CHANNEL = 'realtime:market'

/* ✅ 추가된 Redis Keys */
const PRICE_KEY = `market:last:price:${SYMBOL}`
const OI_KEY = `market:last:oi:${SYMBOL}`
const FUNDING_KEY = `market:last:funding:${SYMBOL}`

/* =========================
 * 🔥 AggTrade Stream
 * ========================= */
const tradeWs = new WebSocket(
  'wss://stream.binance.com:9443/ws/btcusdt@aggTrade',
)

/* =========================
 * 🔥 Mark Price Stream
 * ========================= */
const markPriceWs = new WebSocket(
  'wss://stream.binance.com:9443/ws/btcusdt@markPrice@1s',
)

let volumeBufferUSD = 0

/* =========================
 * 1초 루프
 * ========================= */
setInterval(async () => {
  const now = Date.now()
  const volume = Math.round(volumeBufferUSD)

  if (volume > 0) {
    try {
      /* 1️⃣ Volume publish */
      await redis.publish(
        CHANNEL,
        JSON.stringify({
          type: 'VOLUME_TICK',
          symbol: SYMBOL,
          volume,
          ts: now,
        }),
      )

      /* 2️⃣ Whale Intensity 계산 */
      const lastOI = getLastOI(SYMBOL)
      const prevOI = getPrevOI(SYMBOL)
      const lastVolume = getLastVolume(SYMBOL)
      const prevVolume = getPrevVolume(SYMBOL)

      if (
        lastOI !== undefined &&
        prevOI !== undefined &&
        lastVolume !== undefined &&
        prevVolume !== undefined
      ) {
        const oiDelta = Math.abs(lastOI - prevOI)
        const volumeDelta =
          prevVolume > 0 ? lastVolume / prevVolume : 0

        const intensityLabel = calcWhaleIntensity({
          oiDelta,
          volumeDelta,
          absoluteVolume: volume,
          volumeShock: volumeDelta,
        })

        const raw =
          oiDelta * 0.04 +
          Math.max(0, volumeDelta - 1) * 0.6

        const normalized =
          1 - Math.exp(-raw * 1.6)

        const intensity =
          intensityLabel === 'HIGH'
            ? Math.max(0.8, normalized)
            : intensityLabel === 'MEDIUM'
            ? Math.max(0.45, normalized)
            : normalized

        /* 3️⃣ Redis 저장 (🔥 추가됨) */
        await saveWhaleIntensity(SYMBOL, intensity)

        /* 4️⃣ SSE publish */
        await redis.publish(
          CHANNEL,
          JSON.stringify({
            type: 'WHALE_INTENSITY_TICK',
            symbol: SYMBOL,
            intensity,
            avg: normalized,
            trend: intensity > 0.5 ? 'UP' : 'FLAT',
            isSpike: intensity > 0.85,
            ts: now,
          }),
        )
      }
    } catch (e) {
      console.error('[WHALER_ENGINE_ERROR]', e)
    }
  }

  volumeBufferUSD = 0
}, 1000)

/* =========================
 * AggTrade (가격)
 * ========================= */
tradeWs.on('message', async raw => {
  try {
    const data = JSON.parse(raw.toString())
    const price = Number(data.p)
    const qty = Number(data.q)

    if (!Number.isFinite(price) || !Number.isFinite(qty)) return

    volumeBufferUSD += price * qty

    /* 🔥 PRICE Redis 저장 추가 */
    await redis.set(PRICE_KEY, String(price))

    await onPriceUpdate(SYMBOL, price, qty)
  } catch {}
})

/* =========================
 * Funding
 * ========================= */
markPriceWs.on('message', async raw => {
  try {
    const data = JSON.parse(raw.toString())
    const fundingRate = Number(data.r)
    if (!Number.isFinite(fundingRate)) return

    /* 🔥 FUNDING Redis 저장 추가 */
    await redis.set(FUNDING_KEY, String(fundingRate))

    await redis.publish(
      CHANNEL,
      JSON.stringify({
        type: 'FUNDING_RATE_TICK',
        symbol: SYMBOL,
        fundingRate,
        ts: Date.now(),
      }),
    )
  } catch {}
})
