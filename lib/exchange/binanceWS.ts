import WebSocket from 'ws'
import { onPriceUpdate } from '@/lib/market/pricePolling'
import { redis } from '@/lib/redis'

import {
  setLastTradeUSD,
  setLastWhaleTradeUSD,
  setLastWhaleBuyUSD,
  setLastWhaleSellUSD,
} from '@/lib/market/marketLastStateStore'

type BinanceWsMode = 'combined' | 'multi'

type BinanceMarketStreamOptions = {
  symbol?: string
  mode?: BinanceWsMode
  whaleThresholdUSD?: number
  oiPollIntervalMs?: number
  channel?: string
  debug?: boolean
}

type ManagedSocket = {
  name: string
  url: string
  ws: WebSocket | null
  reconnectTimer: ReturnType<typeof setTimeout> | null
  heartbeatTimer: ReturnType<typeof setInterval> | null
  healthTimer: ReturnType<typeof setInterval> | null
  manualClose: boolean
  reconnectCount: number
  messageCount: number
  aggTradeCount: number
  markPriceCount: number
  lastMessageAt: number
}

const g = globalThis as typeof globalThis & {
  __BINANCE_STREAM_STARTED__?: boolean
  __BINANCE_STREAM_STOP__?: (() => void) | null
}

const DEFAULT_SYMBOL = 'BTCUSDT'
const DEFAULT_CHANNEL = 'realtime:raw'
const DEFAULT_WHALE_THRESHOLD_USD = 20_000
const DEFAULT_OI_POLL_INTERVAL_MS = 5_000
const OI_FETCH_TIMEOUT_MS = 4_000

const MARKET_COMBINED_BASE = 'wss://fstream.binance.com/market/stream'
const MARKET_SINGLE_BASE = 'wss://fstream.binance.com/market/ws'
const PRIVATE_BASE = 'wss://fstream.binance.com/private/ws'

function log(debug: boolean, label: string, payload?: unknown) {
  if (!debug) return
  if (payload === undefined) console.log(label)
  else console.log(label, payload)
}

function warn(label: string, payload?: unknown) {
  if (payload === undefined) console.warn(label)
  else console.warn(label, payload)
}

function buildCombinedMarketUrl(symbol: string) {
  const s = symbol.toLowerCase()
  return `${MARKET_COMBINED_BASE}?streams=${s}@aggTrade/${s}@markPrice@1s`
}

function buildSingleMarketUrl(symbol: string, stream: string) {
  const s = symbol.toLowerCase()
  return `${MARKET_SINGLE_BASE}/${s}@${stream}`
}

function buildOpenInterestUrl(symbol: string) {
  return `https://fapi.binance.com/fapi/v1/openInterest?symbol=${symbol}`
}

export function connectBinancePNLStream(
  listenKey: string,
  onUpdate: (pnl: number) => void,
) {
  const ws = new WebSocket(
    `${PRIVATE_BASE}?listenKey=${encodeURIComponent(
      listenKey,
    )}&events=ACCOUNT_UPDATE`,
  )

  ws.on('open', () => {
    console.log('[BINANCE_PNL_WS_OPEN]', {
      readyState: ws.readyState,
      at: new Date().toISOString(),
    })
  })

  ws.on('message', raw => {
    try {
      const data = JSON.parse(raw.toString())

      console.log('[BINANCE_PNL_WS_MESSAGE]', {
        eventType: data?.e,
        at: new Date().toISOString(),
      })

      if (data.e === 'ACCOUNT_UPDATE') {
        const totalPNL = data.a.P.reduce(
          (sum: number, p: any) => sum + Number(p.up),
          0,
        )

        onUpdate(totalPNL)
      }
    } catch (error) {
      console.error('[BINANCE_PNL_WS_PARSE_ERROR]', error)
    }
  })

  ws.on('ping', data => {
    try {
      ws.pong(data)
    } catch {}
  })

  ws.on('error', error => {
    console.error('[BINANCE_PNL_WS_ERROR]', error)
  })

  ws.on('close', (code, reason) => {
    console.warn('[BINANCE_PNL_WS_CLOSED]', {
      code,
      reason: reason?.toString?.(),
      at: new Date().toISOString(),
    })
  })

  return () => ws.close()
}

export function startBinanceMarketStream(
  options: BinanceMarketStreamOptions = {},
) {
  const SYMBOL = options.symbol ?? DEFAULT_SYMBOL
  const CHANNEL = options.channel ?? DEFAULT_CHANNEL
  const MODE = options.mode ?? 'multi'
  const DEBUG = options.debug ?? true

  const PRICE_KEY = `market:last:price:${SYMBOL}`
  const FUNDING_KEY = `market:last:funding:${SYMBOL}`

  const WHALE_THRESHOLD_USD =
    options.whaleThresholdUSD ?? DEFAULT_WHALE_THRESHOLD_USD

  const OI_POLL_INTERVAL_MS =
    options.oiPollIntervalMs ?? DEFAULT_OI_POLL_INTERVAL_MS

  const OI_REST_URL = buildOpenInterestUrl(SYMBOL)

  let stopped = false
  let oiPolling = false

  let totalVolumeBufferUSD = 0
  let whaleBuyVolumeBufferUSD = 0
  let whaleSellVolumeBufferUSD = 0

  const sockets: ManagedSocket[] = []

  log(DEBUG, '[BINANCE STREAM CONFIG]', {
    symbol: SYMBOL,
    channel: CHANNEL,
    mode: MODE,
    whaleThresholdUSD: WHALE_THRESHOLD_USD,
    oiPollIntervalMs: OI_POLL_INTERVAL_MS,
    oiRestUrl: OI_REST_URL,
    endpoint:
      MODE === 'combined'
        ? buildCombinedMarketUrl(SYMBOL)
        : [
            buildSingleMarketUrl(SYMBOL, 'aggTrade'),
            buildSingleMarketUrl(SYMBOL, 'markPrice@1s'),
          ],
    at: new Date().toISOString(),
  })

  async function pollOpenInterest(source: 'initial' | 'interval') {
    if (stopped) {
      warn('[OI_POLL_SKIPPED_STOPPED]', { source })
      return
    }

    if (oiPolling) {
      warn('[OI_POLL_SKIPPED_IN_FLIGHT]', { source })
      return
    }

    oiPolling = true

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), OI_FETCH_TIMEOUT_MS)

    log(DEBUG, '[OI_POLL_TICK]', {
      source,
      url: OI_REST_URL,
      at: new Date().toISOString(),
    })

    try {
      const res = await fetch(OI_REST_URL, {
        cache: 'no-store',
        signal: controller.signal,
      })

      log(DEBUG, '[OI_POLL_HTTP_RESPONSE]', {
        source,
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
      })

      if (!res.ok) return

      const data = await res.json()
      const openInterest = Number(data.openInterest)

      log(DEBUG, '[OI_POLL_RESULT]', {
        source,
        symbol: data.symbol,
        openInterest,
        raw: data.openInterest,
      })

      if (!Number.isFinite(openInterest)) {
        warn('[OI_INVALID]', { source, data })
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

      log(DEBUG, '[OI_TICK_PUBLISHED]', {
        source,
        channel: CHANNEL,
        symbol: SYMBOL,
        openInterest,
      })
    } catch (error) {
      console.error('[OI_POLL_ERROR]', { source, error })
    } finally {
      clearTimeout(timeout)
      oiPolling = false
    }
  }

  log(DEBUG, '[OI_LOOP_BOOT]', {
    intervalMs: OI_POLL_INTERVAL_MS,
    immediate: true,
  })

  void pollOpenInterest('initial')

  const oiLoop = setInterval(() => {
    void pollOpenInterest('interval')
  }, OI_POLL_INTERVAL_MS)

  async function handleAggTrade(data: any, streamName: string) {
    const now = Date.now()

    const price = Number(data.p)
    const qty = Number(data.q)
    const isBuyerMaker = data.m

    log(DEBUG, '[AGG_TRADE_DETECTED]', {
      stream: streamName,
      priceRaw: data.p,
      qtyRaw: data.q,
      isBuyerMaker,
    })

    if (!Number.isFinite(price) || !Number.isFinite(qty)) {
      warn('[AGG_TRADE_INVALID_NUMBERS]', {
        priceRaw: data.p,
        qtyRaw: data.q,
        price,
        qty,
      })
      return
    }

    const tradeUSD = price * qty

    totalVolumeBufferUSD += tradeUSD

    if (tradeUSD >= WHALE_THRESHOLD_USD) {
      if (isBuyerMaker) {
        whaleSellVolumeBufferUSD += tradeUSD
      } else {
        whaleBuyVolumeBufferUSD += tradeUSD
      }

      log(DEBUG, '[WHALE_TRADE_MATCHED]', {
        symbol: SYMBOL,
        price,
        qty,
        tradeUSD,
        side: isBuyerMaker ? 'SELL_PRESSURE' : 'BUY_PRESSURE',
        whaleThresholdUSD: WHALE_THRESHOLD_USD,
      })
    }

    log(DEBUG, '[TRADE_CALC]', {
      symbol: SYMBOL,
      price,
      qty,
      tradeUSD,
      totalVolumeBufferUSD,
      whaleBuyVolumeBufferUSD,
      whaleSellVolumeBufferUSD,
      whaleThresholdUSD: WHALE_THRESHOLD_USD,
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

    log(DEBUG, '[REDIS_PUBLISH_PRICE_TICK]', {
      channel: CHANNEL,
      symbol: SYMBOL,
      price,
    })

    await onPriceUpdate(SYMBOL, price, qty)

    log(DEBUG, '[ON_PRICE_UPDATE_CALLED]', {
      symbol: SYMBOL,
      price,
      qty,
    })
  }

  async function handleMarkPrice(data: any, streamName: string) {
    const now = Date.now()

    log(DEBUG, '[MARK_PRICE_DETECTED]', {
      stream: streamName,
      data,
    })

    const fundingRate = Number(data.r)

    log(DEBUG, '[MARK_PRICE_FIELDS]', {
      markPrice: data.p,
      fundingRateRaw: data.r,
      fundingRate,
      data_i_raw: data.i,
      caution:
        'data.i is NOT used as openInterest. OI_TICK is published only by REST polling.',
    })

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

      log(DEBUG, '[REDIS_PUBLISH_FUNDING_RATE_TICK]', {
        channel: CHANNEL,
        symbol: SYMBOL,
        fundingRate,
      })
    } else {
      warn('[FUNDING_RATE_INVALID]', {
        raw: data.r,
        fundingRate,
      })
    }
  }

  async function handleMessage(socket: ManagedSocket, raw: WebSocket.RawData) {
    socket.lastMessageAt = Date.now()
    socket.messageCount += 1

    const rawText = raw.toString()

    log(DEBUG, '[WS_MESSAGE]', {
      socket: socket.name,
      count: socket.messageCount,
      length: rawText.length,
      sample: rawText.slice(0, 300),
      at: new Date().toISOString(),
    })

    try {
      const parsed = JSON.parse(rawText)

      const stream =
        typeof parsed?.stream === 'string'
          ? parsed.stream
          : socket.name === 'AGG_TRADE'
          ? `${SYMBOL.toLowerCase()}@aggTrade`
          : socket.name === 'MARK_PRICE'
          ? `${SYMBOL.toLowerCase()}@markPrice@1s`
          : ''

      const data = parsed?.data ?? parsed

      log(DEBUG, '[WS_PARSED]', {
        socket: socket.name,
        stream,
        hasData: !!data,
        parsedKeys: Object.keys(parsed || {}),
        dataKeys: data ? Object.keys(data) : [],
      })

      if (!stream || !data) {
        warn('[WS_MESSAGE_INVALID_SHAPE]', {
          socket: socket.name,
          stream,
          hasData: !!data,
          parsed,
        })
        return
      }

      const streamName = stream.toLowerCase()

      if (streamName.includes('@aggtrade')) {
        socket.aggTradeCount += 1
        await handleAggTrade(data, streamName)
        return
      }

      if (streamName.includes('@markprice')) {
        socket.markPriceCount += 1
        await handleMarkPrice(data, streamName)
        return
      }

      warn('[UNKNOWN_STREAM_BRANCH]', {
        socket: socket.name,
        stream: streamName,
        data,
      })
    } catch (error) {
      console.error('[BINANCE_STREAM_PARSE_ERROR]', {
        socket: socket.name,
        error,
        rawSample: rawText.slice(0, 300),
      })
    }
  }

  function scheduleReconnect(socket: ManagedSocket) {
    if (stopped || socket.manualClose) return
    if (socket.reconnectTimer) return

    const delay = Math.min(30_000, 1_000 * 2 ** socket.reconnectCount)

    socket.reconnectCount += 1

    warn('[BINANCE_WS_RECONNECT_SCHEDULED]', {
      socket: socket.name,
      delay,
      reconnectCount: socket.reconnectCount,
      url: socket.url,
    })

    socket.reconnectTimer = setTimeout(() => {
      socket.reconnectTimer = null
      connectSocket(socket)
    }, delay)
  }

  function clearSocketTimers(socket: ManagedSocket) {
    if (socket.heartbeatTimer) {
      clearInterval(socket.heartbeatTimer)
      socket.heartbeatTimer = null
    }

    if (socket.healthTimer) {
      clearInterval(socket.healthTimer)
      socket.healthTimer = null
    }
  }

  function connectSocket(socket: ManagedSocket) {
    if (stopped) return

    clearSocketTimers(socket)

    if (socket.ws) {
      try {
        socket.ws.removeAllListeners()
        socket.ws.terminate()
      } catch {}

      socket.ws = null
    }

    socket.manualClose = false
    socket.lastMessageAt = Date.now()

    log(DEBUG, '[BINANCE_WS_CONNECTING]', {
      socket: socket.name,
      url: socket.url,
      at: new Date().toISOString(),
    })

    const ws = new WebSocket(socket.url)
    socket.ws = ws

    ws.on('open', () => {
      socket.reconnectCount = 0

      log(DEBUG, '[BINANCE_WS_OPEN]', {
        socket: socket.name,
        url: socket.url,
        readyState: ws.readyState,
        at: new Date().toISOString(),
      })

      socket.heartbeatTimer = setInterval(() => {
        if (!socket.ws || socket.ws.readyState !== WebSocket.OPEN) return

        try {
          socket.ws.ping()
          log(DEBUG, '[BINANCE_WS_PING_SENT]', {
            socket: socket.name,
            at: new Date().toISOString(),
          })
        } catch (error) {
          console.error('[BINANCE_WS_PING_ERROR]', {
            socket: socket.name,
            error,
          })
        }
      }, 15_000)

      socket.healthTimer = setInterval(() => {
        const gap = Date.now() - socket.lastMessageAt

        log(DEBUG, '[BINANCE_WS_HEALTH]', {
          socket: socket.name,
          readyState: socket.ws?.readyState,
          messageCount: socket.messageCount,
          aggTradeCount: socket.aggTradeCount,
          markPriceCount: socket.markPriceCount,
          lastMessageAgoMs: gap,
          at: new Date().toISOString(),
        })

        if (gap > 10_000) {
          warn('[BINANCE_WS_STALE]', {
            socket: socket.name,
            readyState: socket.ws?.readyState,
            lastMessageAgoMs: gap,
            url: socket.url,
          })
        }

        if (gap > 30_000) {
          warn('[BINANCE_WS_FORCE_RECONNECT_STALE]', {
            socket: socket.name,
            lastMessageAgoMs: gap,
          })

          try {
            socket.ws?.terminate()
          } catch {}

          scheduleReconnect(socket)
        }
      }, 5_000)
    })

    ws.on('message', raw => {
      void handleMessage(socket, raw)
    })

    ws.on('ping', data => {
      log(DEBUG, '[BINANCE_WS_PING_RECEIVED]', {
        socket: socket.name,
        at: new Date().toISOString(),
      })

      try {
        ws.pong(data)
      } catch {}
    })

    ws.on('pong', () => {
      log(DEBUG, '[BINANCE_WS_PONG_RECEIVED]', {
        socket: socket.name,
        at: new Date().toISOString(),
      })
    })

    ws.on('error', error => {
      console.error('[BINANCE_WS_ERROR]', {
        socket: socket.name,
        error,
        readyState: ws.readyState,
        at: new Date().toISOString(),
      })
    })

    ws.on('close', (code, reason) => {
      clearSocketTimers(socket)

      warn('[BINANCE_WS_CLOSED]', {
        socket: socket.name,
        code,
        reason: reason?.toString?.(),
        readyState: ws.readyState,
        at: new Date().toISOString(),
      })

      socket.ws = null

      scheduleReconnect(socket)
    })
  }

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

    log(DEBUG, '[VOLUME_LOOP]', {
      totalVolume,
      whaleBuyVolume,
      whaleSellVolume,
      whaleTotalVolume,
      whaleNetPressure,
      whaleRatio,
      whaleNetRatio,
      whaleThresholdUSD: WHALE_THRESHOLD_USD,
      at: new Date(now).toISOString(),
    })

    try {
      setLastTradeUSD(SYMBOL, totalVolume)
      setLastWhaleTradeUSD(SYMBOL, whaleTotalVolume)
      setLastWhaleBuyUSD(SYMBOL, whaleBuyVolume)
      setLastWhaleSellUSD(SYMBOL, whaleSellVolume)

      log(DEBUG, '[MARKET_LAST_STATE_UPDATED]', {
        symbol: SYMBOL,
        totalVolume,
        whaleTotalVolume,
        whaleBuyVolume,
        whaleSellVolume,
      })

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

      log(DEBUG, '[REDIS_PUBLISH_VOLUME_AND_WHALE]', {
        channel: CHANNEL,
        symbol: SYMBOL,
        volume: totalVolume,
        whaleTotalVolume,
        whaleBuyVolume,
        whaleSellVolume,
        whaleNetPressure,
        whaleNetRatio,
      })
    } catch (error) {
      console.error('[NET_PRESSURE_ENGINE_ERROR]', error)
    }

    totalVolumeBufferUSD = 0
    whaleBuyVolumeBufferUSD = 0
    whaleSellVolumeBufferUSD = 0
  }, 1000)

  if (MODE === 'combined') {
    sockets.push({
      name: 'COMBINED',
      url: buildCombinedMarketUrl(SYMBOL),
      ws: null,
      reconnectTimer: null,
      heartbeatTimer: null,
      healthTimer: null,
      manualClose: false,
      reconnectCount: 0,
      messageCount: 0,
      aggTradeCount: 0,
      markPriceCount: 0,
      lastMessageAt: Date.now(),
    })
  } else {
    sockets.push(
      {
        name: 'AGG_TRADE',
        url: buildSingleMarketUrl(SYMBOL, 'aggTrade'),
        ws: null,
        reconnectTimer: null,
        heartbeatTimer: null,
        healthTimer: null,
        manualClose: false,
        reconnectCount: 0,
        messageCount: 0,
        aggTradeCount: 0,
        markPriceCount: 0,
        lastMessageAt: Date.now(),
      },
      {
        name: 'MARK_PRICE',
        url: buildSingleMarketUrl(SYMBOL, 'markPrice@1s'),
        ws: null,
        reconnectTimer: null,
        heartbeatTimer: null,
        healthTimer: null,
        manualClose: false,
        reconnectCount: 0,
        messageCount: 0,
        aggTradeCount: 0,
        markPriceCount: 0,
        lastMessageAt: Date.now(),
      },
    )
  }

  for (const socket of sockets) {
    connectSocket(socket)
  }

  return function stopBinanceMarketStream() {
    stopped = true

    clearInterval(volumeLoop)
    clearInterval(oiLoop)

    for (const socket of sockets) {
      socket.manualClose = true

      if (socket.reconnectTimer) {
        clearTimeout(socket.reconnectTimer)
        socket.reconnectTimer = null
      }

      clearSocketTimers(socket)

      if (socket.ws) {
        try {
          socket.ws.close()
        } catch {}

        try {
          socket.ws.terminate()
        } catch {}

        socket.ws = null
      }
    }

    log(DEBUG, '[BINANCE_STREAM_STOPPED]', {
      symbol: SYMBOL,
      mode: MODE,
      at: new Date().toISOString(),
    })
  }
}

export function bootstrapBinanceMarketStreamOnce(
  options: BinanceMarketStreamOptions = {},
) {
  console.log('[BINANCE STREAM FLAG CHECK]', {
    alreadyStarted: g.__BINANCE_STREAM_STARTED__ === true,
    hasStop: typeof g.__BINANCE_STREAM_STOP__ === 'function',
    at: new Date().toISOString(),
  })

  if (
    g.__BINANCE_STREAM_STARTED__ &&
    typeof g.__BINANCE_STREAM_STOP__ === 'function'
  ) {
    console.warn('[BINANCE STREAM] skipped because already started', {
      __BINANCE_STREAM_STARTED__: g.__BINANCE_STREAM_STARTED__,
      at: new Date().toISOString(),
    })

    return g.__BINANCE_STREAM_STOP__
  }

  if (
    g.__BINANCE_STREAM_STARTED__ &&
    typeof g.__BINANCE_STREAM_STOP__ !== 'function'
  ) {
    console.warn('[BINANCE STREAM FLAG STALE RESET]', {
      message:
        'Global flag was true but stop function was missing. Resetting singleton state.',
    })

    g.__BINANCE_STREAM_STARTED__ = false
    g.__BINANCE_STREAM_STOP__ = null
  }

  g.__BINANCE_STREAM_STARTED__ = true

  console.log('[BINANCE STREAM] started', {
    mode: options.mode ?? 'multi',
    symbol: options.symbol ?? DEFAULT_SYMBOL,
    whaleThresholdUSD:
      options.whaleThresholdUSD ?? DEFAULT_WHALE_THRESHOLD_USD,
    at: new Date().toISOString(),
  })

  const stop = startBinanceMarketStream({
    ...options,
    mode: options.mode ?? 'multi',
    whaleThresholdUSD:
      options.whaleThresholdUSD ?? DEFAULT_WHALE_THRESHOLD_USD,
  })

  g.__BINANCE_STREAM_STOP__ = stop

  return stop
}
