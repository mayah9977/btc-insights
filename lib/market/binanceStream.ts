import WebSocket from 'ws'
import { onPriceUpdate } from './pricePolling'
import { redis } from '@/lib/redis'

/* 🔥 추가 */
import {
  setLastTradeUSD,
  setLastWhaleTradeUSD,
  setLastWhaleBuyUSD,
  setLastWhaleSellUSD,
} from '@/lib/market/marketLastStateStore'

/* ===================================================== */

const g = globalThis as typeof globalThis & {
  __BINANCE_STREAM_STARTED__?: boolean
}

if (!g.__BINANCE_STREAM_STARTED__) {
  g.__BINANCE_STREAM_STARTED__ = true

  console.log('[BINANCE STREAM] started (combined futures)')

  const SYMBOL = 'BTCUSDT'
  const CHANNEL = 'realtime:raw'

  const PRICE_KEY = `market:last:price:${SYMBOL}`
  const FUNDING_KEY = `market:last:funding:${SYMBOL}`

  const WHALE_THRESHOLD_USD = 200_000

  const combinedWs = new WebSocket(
    `wss://fstream.binance.com/stream?streams=${SYMBOL.toLowerCase()}@aggTrade/${SYMBOL.toLowerCase()}@markPrice@1s`,
  )

  /* =========================
     1초 집계 버퍼
  ========================= */

  let totalVolumeBufferUSD = 0
  let whaleBuyVolumeBufferUSD = 0
  let whaleSellVolumeBufferUSD = 0

  /* =========================
     🔥 1초 루프
  ========================= */

  setInterval(async () => {
    const now = Date.now()

    const totalVolume = totalVolumeBufferUSD
    const whaleBuyVolume = whaleBuyVolumeBufferUSD
    const whaleSellVolume = whaleSellVolumeBufferUSD

    const whaleTotalVolume = whaleBuyVolume + whaleSellVolume
    const whaleNetPressure = whaleBuyVolume - whaleSellVolume

    const whaleRatio =
      totalVolume > 0 ? whaleTotalVolume / totalVolume : 0

    const whaleNetRatio =
      totalVolume > 0 ? whaleNetPressure / totalVolume : 0

    try {
      /* =========================
         🔥 SSOT 저장 (핵심)
      ========================= */

      setLastTradeUSD(SYMBOL, totalVolume)
      setLastWhaleTradeUSD(SYMBOL, whaleTotalVolume)
      setLastWhaleBuyUSD(SYMBOL, whaleBuyVolume)
      setLastWhaleSellUSD(SYMBOL, whaleSellVolume)

      /* =========================
         Redis publish
      ========================= */

      await redis.publish(
        CHANNEL,
        JSON.stringify({
          type: 'VOLUME_TICK',
          symbol: SYMBOL,
          volume: totalVolume,
          ts: now,
        }),
      )

      await redis.publish(
        CHANNEL,
        JSON.stringify({
          type: 'WHALE_TRADE_FLOW',
          symbol: SYMBOL,
          ratio: Math.max(0, Math.min(1, whaleRatio)),
          whaleVolume: whaleTotalVolume,
          totalVolume,
          ts: now,
        }),
      )

      await redis.publish(
        CHANNEL,
        JSON.stringify({
          type: 'WHALE_NET_PRESSURE',
          symbol: SYMBOL,
          whaleBuyVolume,
          whaleSellVolume,
          whaleNetPressure,
          whaleNetRatio,
          totalVolume,
          ts: now,
        }),
      )
    } catch (e) {
      console.error('[NET_PRESSURE_ENGINE_ERROR]', e)
    }

    /* 🔄 버퍼 초기화 */
    totalVolumeBufferUSD = 0
    whaleBuyVolumeBufferUSD = 0
    whaleSellVolumeBufferUSD = 0
  }, 1000)

  /* ===================================================== */

  combinedWs.on('open', () => {
    console.log('[FUTURES COMBINED WS CONNECTED]')
  })

  combinedWs.on('message', async raw => {
    try {
      const parsed = JSON.parse(raw.toString())
      const stream = parsed?.stream
      const data = parsed?.data
      if (!stream || !data) return

      const streamName = stream.toLowerCase()
      const now = Date.now()

      /* =========================
         1️⃣ aggTrade
      ========================= */

      if (streamName.includes('@aggtrade')) {
        const price = Number(data.p)
        const qty = Number(data.q)
        const isBuyerMaker = data.m

        if (!Number.isFinite(price) || !Number.isFinite(qty)) return

        const tradeUSD = price * qty

        totalVolumeBufferUSD += tradeUSD

        if (tradeUSD >= WHALE_THRESHOLD_USD) {
          if (isBuyerMaker) {
            whaleSellVolumeBufferUSD += tradeUSD
          } else {
            whaleBuyVolumeBufferUSD += tradeUSD
          }
        }

        await redis.set(PRICE_KEY, String(price))

        await redis.publish(
          CHANNEL,
          JSON.stringify({
            type: 'PRICE_TICK',
            symbol: SYMBOL,
            price,
            ts: now,
          }),
        )

        await onPriceUpdate(SYMBOL, price, qty)
      }

      /* =========================
         2️⃣ markPrice@1s
      ========================= */

      if (streamName.includes('@markprice')) {
        const fundingRate = Number(data.r)
        const openInterest = Number(data.i)

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
      }
    } catch (e) {
      console.error('[COMBINED_STREAM_PARSE_ERROR]', e)
    }
  })

  combinedWs.on('error', err => {
    console.error('[COMBINED_WS_ERROR]', err)
  })

  combinedWs.on('close', () => {
    console.warn('[COMBINED_WS_CLOSED]')
  })
}
