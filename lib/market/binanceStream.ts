import WebSocket from 'ws'
import { onPriceUpdate } from './pricePolling'
import { redis } from '@/lib/redis'

/* =====================================================
   🔒 GLOBAL GUARD (HMR / 중복 실행 방지)
===================================================== */

const g = globalThis as typeof globalThis & {
  __BINANCE_STREAM_STARTED__?: boolean
}

if (!g.__BINANCE_STREAM_STARTED__) {
  g.__BINANCE_STREAM_STARTED__ = true

  console.log('[BINANCE STREAM] started (guarded)')

  /* =========================
   * Constants
   * ========================= */

  const SYMBOL = 'BTCUSDT'
  const CHANNEL = 'realtime:market'

  const PRICE_KEY = `market:last:price:${SYMBOL}`
  const FUNDING_KEY = `market:last:funding:${SYMBOL}`

  /* =========================
   * WebSocket Streams
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

  const WHALE_THRESHOLD_USD = 200_000

  /* =========================
   * 1초 루프 (Trade Flow Engine)
   * ========================= */

  setInterval(async () => {
    const now = Date.now()

    const totalVolume = Math.round(totalVolumeBufferUSD)
    const whaleVolume = Math.round(whaleVolumeBufferUSD)

    if (totalVolume > 0) {
      try {
        /* 1️⃣ Volume Publish */
        await redis.publish(
          CHANNEL,
          JSON.stringify({
            type: 'VOLUME_TICK',
            symbol: SYMBOL,
            volume: totalVolume,
            ts: now,
          }),
        )

        /* 2️⃣ Whale Trade Flow Publish */
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

    /* 버퍼 초기화 */
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

      totalVolumeBufferUSD += tradeUSD

      if (tradeUSD >= WHALE_THRESHOLD_USD) {
        whaleVolumeBufferUSD += tradeUSD
      }

      await redis.set(PRICE_KEY, String(price))

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

  /* =========================
   * Error Handling
   * ========================= */

  tradeWs.on('error', err => {
    console.error('[TRADE_WS_ERROR]', err)
  })

  markPriceWs.on('error', err => {
    console.error('[MARK_PRICE_WS_ERROR]', err)
  })

}
