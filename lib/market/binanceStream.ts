import WebSocket from 'ws'
import { onPriceUpdate } from '@/lib/market/pricePolling'
import { redis } from '@/lib/redis'

import {
  setLastTradeUSD,
  setLastWhaleTradeUSD,
  setLastWhaleBuyUSD,
  setLastWhaleSellUSD,
} from '@/lib/market/marketLastStateStore'

type Mode = 'multi' | 'combined'

type SocketState = {
  name: string
  url: string
  ws: WebSocket | null
  reconnectCount: number
  lastMessageAt: number
  messageCount: number
  reconnectTimer?: NodeJS.Timeout
  healthTimer?: NodeJS.Timeout
  heartbeatTimer?: NodeJS.Timeout
}

const g = globalThis as typeof globalThis & {
  __BINANCE_STREAM_STARTED__?: boolean
  __BINANCE_STREAM_STOP__?: (() => void) | null
}

const SYMBOL = 'BTCUSDT'
const LOWER_SYMBOL = SYMBOL.toLowerCase()
const CHANNEL = 'realtime:raw'

const PRICE_KEY = `market:last:price:${SYMBOL}`
const FUNDING_KEY = `market:last:funding:${SYMBOL}`

const WHALE_THRESHOLD_USD = 20_000
const OI_POLL_INTERVAL_MS = 5_000
const OI_FETCH_TIMEOUT_MS = 4_000

const MARKET_COMBINED_URL =
  `wss://fstream.binance.com/market/stream?streams=${LOWER_SYMBOL}@aggTrade/${LOWER_SYMBOL}@markPrice@1s`

const AGG_TRADE_URL =
  `wss://fstream.binance.com/market/ws/${LOWER_SYMBOL}@aggTrade`

const MARK_PRICE_URL =
  `wss://fstream.binance.com/market/ws/${LOWER_SYMBOL}@markPrice@1s`

const OI_REST_URL =
  `https://fapi.binance.com/fapi/v1/openInterest?symbol=${SYMBOL}`

export function startBinanceMarketStream(mode: Mode = 'multi') {
  const sockets: SocketState[] = []
  let stopped = false
  let oiPolling = false

  console.log('[BINANCE_STREAM_START]', {
    mode,
    symbol: SYMBOL,
    whaleThresholdUSD: WHALE_THRESHOLD_USD,
    oiPollIntervalMs: OI_POLL_INTERVAL_MS,
    oiRestUrl: OI_REST_URL,
  })

  let totalVolumeBufferUSD = 0
  let whaleBuyVolumeBufferUSD = 0
  let whaleSellVolumeBufferUSD = 0

  const volumeLoop = setInterval(async () => {
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

    console.log('[VOLUME_LOOP]', {
      totalVolume,
      whaleBuyVolume,
      whaleSellVolume,
      whaleTotalVolume,
      whaleNetPressure,
      whaleRatio,
      whaleNetRatio,
      whaleThresholdUSD: WHALE_THRESHOLD_USD,
    })

    try {
      setLastTradeUSD(SYMBOL, totalVolume)
      setLastWhaleTradeUSD(SYMBOL, whaleTotalVolume)
      setLastWhaleBuyUSD(SYMBOL, whaleBuyVolume)
      setLastWhaleSellUSD(SYMBOL, whaleSellVolume)

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

      console.log('[REDIS_PUBLISH_VOLUME_AND_WHALE]', {
        channel: CHANNEL,
        symbol: SYMBOL,
        totalVolume,
        whaleTotalVolume,
        whaleBuyVolume,
        whaleSellVolume,
        whaleNetPressure,
        whaleNetRatio,
      })
    } catch (e) {
      console.error('[VOLUME_LOOP_ERROR]', e)
    }

    totalVolumeBufferUSD = 0
    whaleBuyVolumeBufferUSD = 0
    whaleSellVolumeBufferUSD = 0
  }, 1000)

  async function pollOpenInterest(source: 'initial' | 'interval') {
    if (stopped) {
      console.warn('[OI_POLL_SKIPPED_STOPPED]', { source })
      return
    }

    if (oiPolling) {
      console.warn('[OI_POLL_SKIPPED_IN_FLIGHT]', { source })
      return
    }

    oiPolling = true

    const controller = new AbortController()
    const timeout = setTimeout(() => {
      controller.abort()
    }, OI_FETCH_TIMEOUT_MS)

    console.log('[OI_POLL_TICK]', {
      source,
      url: OI_REST_URL,
      at: new Date().toISOString(),
    })

    try {
      const res = await fetch(OI_REST_URL, {
        cache: 'no-store',
        signal: controller.signal,
      })

      console.log('[OI_POLL_HTTP_RESPONSE]', {
        source,
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
      })

      if (!res.ok) {
        console.warn('[OI_POLL_HTTP_ERROR]', {
          source,
          status: res.status,
          statusText: res.statusText,
        })
        return
      }

      const data = await res.json()
      const openInterest = Number(data.openInterest)

      console.log('[OI_POLL_RESULT]', {
        source,
        symbol: data.symbol,
        openInterest,
        raw: data.openInterest,
      })

      if (!Number.isFinite(openInterest)) {
        console.warn('[OI_INVALID]', { source, data })
        return
      }

      await redis.publish(
        CHANNEL,
        JSON.stringify({
          type: 'OI_TICK',
          symbol: SYMBOL,
          openInterest,
          ts: Date.now(),
        }),
      )

      console.log('[OI_TICK_PUBLISHED]', {
        source,
        channel: CHANNEL,
        symbol: SYMBOL,
        openInterest,
      })
    } catch (e) {
      console.error('[OI_POLL_ERROR]', { source, error: e })
    } finally {
      clearTimeout(timeout)
      oiPolling = false
    }
  }

  console.log('[OI_LOOP_BOOT]', {
    intervalMs: OI_POLL_INTERVAL_MS,
    immediate: true,
  })

  void pollOpenInterest('initial')

  const oiLoop = setInterval(() => {
    void pollOpenInterest('interval')
  }, OI_POLL_INTERVAL_MS)

  function createSocket(name: string, url: string) {
    const state: SocketState = {
      name,
      url,
      ws: null,
      reconnectCount: 0,
      lastMessageAt: Date.now(),
      messageCount: 0,
    }

    function cleanupTimers() {
      if (state.healthTimer) {
        clearInterval(state.healthTimer)
        state.healthTimer = undefined
      }

      if (state.heartbeatTimer) {
        clearInterval(state.heartbeatTimer)
        state.heartbeatTimer = undefined
      }
    }

    function reconnect() {
      if (stopped) return

      const delay = Math.min(30_000, 1000 * 2 ** state.reconnectCount)
      state.reconnectCount++

      console.log('[WS_RECONNECT]', {
        name,
        delay,
        reconnectCount: state.reconnectCount,
      })

      state.reconnectTimer = setTimeout(connect, delay)
    }

    function connect() {
      if (stopped) return

      cleanupTimers()

      if (state.ws) {
        try {
          state.ws.removeAllListeners()
          state.ws.terminate()
        } catch {}

        state.ws = null
      }

      console.log('[WS_CONNECT]', { name, url })

      const ws = new WebSocket(url)
      state.ws = ws

      ws.on('open', () => {
        console.log('[WS_OPEN]', { name, url })

        state.reconnectCount = 0
        state.lastMessageAt = Date.now()

        state.heartbeatTimer = setInterval(() => {
          if (!state.ws || state.ws.readyState !== WebSocket.OPEN) return

          try {
            state.ws.ping()
            console.log('[WS_PING_SENT]', { name })
          } catch (e) {
            console.error('[WS_PING_ERROR]', { name, error: e })
          }
        }, 15_000)

        state.healthTimer = setInterval(() => {
          const gap = Date.now() - state.lastMessageAt

          console.log('[WS_HEALTH]', {
            name,
            readyState: state.ws?.readyState,
            messageCount: state.messageCount,
            lastMessageAgo: gap,
          })

          if (gap > 10_000) {
            console.warn('[WS_STALE]', { name, gap })
          }

          if (gap > 30_000) {
            console.warn('[WS_FORCE_RECONNECT]', { name, gap })

            try {
              state.ws?.terminate()
            } catch {}
          }
        }, 5000)
      })

      ws.on('ping', data => {
        try {
          ws.pong(data)
          console.log('[WS_PONG_SENT]', { name })
        } catch {}
      })

      ws.on('pong', () => {
        console.log('[WS_PONG_RECEIVED]', { name })
      })

      ws.on('message', async raw => {
        state.lastMessageAt = Date.now()
        state.messageCount++

        const text = raw.toString()

        console.log('[WS_MESSAGE]', {
          name,
          count: state.messageCount,
          sample: text.slice(0, 200),
        })

        try {
          const parsed = JSON.parse(text)

          const stream =
            parsed?.stream ||
            (name === 'AGG'
              ? `${LOWER_SYMBOL}@aggTrade`
              : `${LOWER_SYMBOL}@markPrice@1s`)

          const data = parsed?.data ?? parsed

          if (!data) return

          const streamName = String(stream).toLowerCase()
          const now = Date.now()

          if (streamName.includes('@aggtrade')) {
            console.log('[AGG_TRADE_DETECTED]')

            const price = Number(data.p)
            const qty = Number(data.q)
            const isBuyerMaker = data.m

            if (!Number.isFinite(price) || !Number.isFinite(qty)) {
              console.warn('[AGG_TRADE_INVALID]', {
                priceRaw: data.p,
                qtyRaw: data.q,
              })
              return
            }

            const usd = price * qty

            totalVolumeBufferUSD += usd

            if (usd >= WHALE_THRESHOLD_USD) {
              if (isBuyerMaker) {
                whaleSellVolumeBufferUSD += usd
              } else {
                whaleBuyVolumeBufferUSD += usd
              }

              console.log('[WHALE_TRADE_MATCHED]', {
                price,
                qty,
                usd,
                isBuyerMaker,
                side: isBuyerMaker ? 'SELL_PRESSURE' : 'BUY_PRESSURE',
                whaleThresholdUSD: WHALE_THRESHOLD_USD,
              })
            }

            console.log('[TRADE_CALC]', {
              price,
              qty,
              usd,
              whaleThresholdUSD: WHALE_THRESHOLD_USD,
              totalVolumeBufferUSD,
              whaleBuyVolumeBufferUSD,
              whaleSellVolumeBufferUSD,
            })

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

            return
          }

          if (streamName.includes('@markprice')) {
            console.log('[MARK_PRICE_DETECTED]')

            const fundingRate = Number(data.r)

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

              console.log('[REDIS_PUBLISH_FUNDING_RATE_TICK]', {
                channel: CHANNEL,
                symbol: SYMBOL,
                fundingRate,
              })
            }

            return
          }

          console.warn('[UNKNOWN_STREAM]', {
            name,
            stream: streamName,
            data,
          })
        } catch (e) {
          console.error('[WS_PARSE_ERROR]', e)
        }
      })

      ws.on('close', (code, reason) => {
        console.warn('[WS_CLOSED]', {
          name,
          code,
          reason: reason?.toString?.(),
        })

        cleanupTimers()
        state.ws = null

        reconnect()
      })

      ws.on('error', err => {
        console.error('[WS_ERROR]', { name, error: err })
      })
    }

    connect()
    sockets.push(state)
  }

  if (mode === 'combined') {
    createSocket('COMBINED', MARKET_COMBINED_URL)
  } else {
    createSocket('AGG', AGG_TRADE_URL)
    createSocket('MARK', MARK_PRICE_URL)
  }

  return () => {
    stopped = true

    clearInterval(volumeLoop)
    clearInterval(oiLoop)

    sockets.forEach(s => {
      try {
        if (s.reconnectTimer) clearTimeout(s.reconnectTimer)
        if (s.healthTimer) clearInterval(s.healthTimer)
        if (s.heartbeatTimer) clearInterval(s.heartbeatTimer)
        s.ws?.close()
        s.ws?.terminate()
      } catch {}
    })

    console.log('[BINANCE_STREAM_STOPPED]')
  }
}

export function bootstrapBinanceMarketStreamOnce() {
  console.log('[BINANCE_STREAM_FLAG_CHECK]', {
    alreadyStarted: g.__BINANCE_STREAM_STARTED__ === true,
    hasStop: typeof g.__BINANCE_STREAM_STOP__ === 'function',
    at: new Date().toISOString(),
  })

  if (
    g.__BINANCE_STREAM_STARTED__ &&
    typeof g.__BINANCE_STREAM_STOP__ === 'function'
  ) {
    console.warn('[BINANCE_STREAM_ALREADY_STARTED]', {
      message:
        'Existing worker stream is already running. Duplicate intervals were prevented.',
    })

    return g.__BINANCE_STREAM_STOP__
  }

  if (
    g.__BINANCE_STREAM_STARTED__ &&
    typeof g.__BINANCE_STREAM_STOP__ !== 'function'
  ) {
    console.warn('[BINANCE_STREAM_FLAG_STALE_RESET]', {
      message:
        'Global flag was true but stop function was missing. Resetting singleton state.',
    })

    g.__BINANCE_STREAM_STARTED__ = false
    g.__BINANCE_STREAM_STOP__ = null
  }

  g.__BINANCE_STREAM_STARTED__ = true

  const stop = startBinanceMarketStream('multi')
  g.__BINANCE_STREAM_STOP__ = stop

  return stop
}
