import WebSocket from 'ws'
import { onPriceUpdate } from './pricePolling'
import { redis } from '@/lib/redis'

const SYMBOL = 'BTCUSDT'
const CHANNEL = 'realtime:market'

/* =========================
 * Redis Keys
 * ========================= */
const PRICE_KEY = `market:last:price:${SYMBOL}`
const FUNDING_KEY = `market:last:funding:${SYMBOL}`

/* =========================
 * Streams
 * ========================= */
const tradeWs = new WebSocket(
  'wss://stream.binance.com:9443/ws/btcusdt@aggTrade',
)

const markPriceWs = new WebSocket(
  'wss://stream.binance.com:9443/ws/btcusdt@markPrice@1s',
)

/* =========================
 * Buffers (1초 집계)
 * ========================= */
let totalVolumeBufferUSD = 0
let whaleVolumeBufferUSD = 0

const WHALE_THRESHOLD_USD = 200_000 // 🔥 고래 기준

/* =========================
 * 1초 루프
 * ========================= */
setInterval(async () => {
  const now = Date.now()

  const totalVolume = Math.round(totalVolumeBufferUSD)
  const whaleVolume = Math.round(whaleVolumeBufferUSD)

  if (totalVolume > 0) {
    try {
      /* =========================
       * 1️⃣ 전체 Volume Publish
       * ========================= */
      await redis.publish(
        CHANNEL,
        JSON.stringify({
          type: 'VOLUME_TICK',
          symbol: SYMBOL,
          volume: totalVolume,
          ts: now,
        }),
      )

      /* =========================
       * 2️⃣ 🆕 Whale Trade Flow 계산
       * ========================= */
      const ratio =
        totalVolume > 0
          ? whaleVolume / totalVolume
          : 0

      await redis.publish(
        CHANNEL,
        JSON.stringify({
          type: 'WHALE_TRADE_FLOW',
          symbol: SYMBOL,
          ratio: Math.max(0, Math.min(1, ratio)),
          whaleVolume,
          totalVolume,
          ts: now,
        }),
      )
    } catch (e) {
      console.error('[TRADE_FLOW_ENGINE_ERROR]', e)
    }
  }

  /* =========================
   * 버퍼 초기화
   * ========================= */
  totalVolumeBufferUSD = 0
  whaleVolumeBufferUSD = 0
}, 1000)

/* =========================
 * AggTrade Stream
 * ========================= */
tradeWs.on('message', async raw => {
  try {
    const data = JSON.parse(raw.toString())

    const price = Number(data.p)
    const qty = Number(data.q)

    if (!Number.isFinite(price) || !Number.isFinite(qty)) return

    const tradeUSD = price * qty

    /* 전체 체결 누적 */
    totalVolumeBufferUSD += tradeUSD

    /* 고래 체결 누적 */
    if (tradeUSD >= WHALE_THRESHOLD_USD) {
      whaleVolumeBufferUSD += tradeUSD
    }

    /* 최신 가격 저장 */
    await redis.set(PRICE_KEY, String(price))

    /* 기존 Price Engine 유지 */
    await onPriceUpdate(SYMBOL, price, qty)
  } catch (e) {
    console.error('[AGG_TRADE_PARSE_ERROR]', e)
  }
})

/* =========================
 * Funding Stream
 * ========================= */
markPriceWs.on('message', async raw => {
  try {
    const data = JSON.parse(raw.toString())
    const fundingRate = Number(data.r)

    if (!Number.isFinite(fundingRate)) return

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
  } catch (e) {
    console.error('[FUNDING_PARSE_ERROR]', e)
  }
})
