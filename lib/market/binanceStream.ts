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
  const CHANNEL = 'realtime:raw'

  const PRICE_KEY = `market:last:price:${SYMBOL}`
  const FUNDING_KEY = `market:last:funding:${SYMBOL}`

  /* =========================
   * WebSocket Streams
   * ========================= */

  // Spot Trade
  const tradeWs = new WebSocket(
    'wss://stream.binance.com:9443/ws/btcusdt@aggTrade',
  )

  // ✅ Futures MarkPrice (Funding + OI 같이 처리)
  const markPriceWs = new WebSocket(
    'wss://fstream.binance.com/ws/btcusdt@markPrice@1s',
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
        await redis.publish(
          CHANNEL,
          JSON.stringify({
            type: 'VOLUME_TICK',
            symbol: SYMBOL,
            volume: totalVolume,
            ts: now,
          }),
        )

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

    totalVolumeBufferUSD = 0
    whaleVolumeBufferUSD = 0
  }, 1000)

  /* =========================
   * PRICE STREAM
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

      await redis.publish(
        CHANNEL,
        JSON.stringify({
          type: 'PRICE_TICK',
          symbol: SYMBOL,
          price,
          ts: Date.now(),
        }),
      )

      await onPriceUpdate(SYMBOL, price, qty)

    } catch (e) {
      console.error('[AGG_TRADE_PARSE_ERROR]', e)
    }
  })

  /* =====================================================
     🔥 MARK PRICE STREAM
     Funding + OI 동시 처리 (정답 구조)
  ===================================================== */

  markPriceWs.on('open', () => {
    console.log('[MARK_PRICE WS CONNECTED]')
  })

  markPriceWs.on('message', async raw => {
    try {
      const data = JSON.parse(raw.toString())
      const now = Date.now()

      const fundingRate = Number(data.r)
      const openInterest = Number(data.i) // 🔥 OI는 i 필드

      // ✅ Funding 처리
      if (Number.isFinite(fundingRate)) {
        await redis.set(FUNDING_KEY, String(fundingRate))

        await redis.publish(
          CHANNEL,
          JSON.stringify({
            type: 'FUNDING_RATE_TICK',
            symbol: SYMBOL,
            fundingRate,
            ts: now,
          }),
        )
      }

      // 🔥 OI 처리 (여기서 같이 발행)
      if (Number.isFinite(openInterest)) {
        await redis.publish(
          CHANNEL,
          JSON.stringify({
            type: 'OI_TICK',
            symbol: SYMBOL,
            openInterest,
            ts: now,
          }),
        )
      }

    } catch (e) {
      console.error('[MARK_PRICE_PARSE_ERROR]', e)
    }
  })

  markPriceWs.on('error', err => {
    console.error('[MARK_PRICE_WS_ERROR]', err)
  })

  markPriceWs.on('close', () => {
    console.warn('[MARK_PRICE_WS_CLOSED]')
  })

  /* =========================
   * Error Handling
   * ========================= */

  tradeWs.on('error', err => {
    console.error('[TRADE_WS_ERROR]', err)
  })
}
