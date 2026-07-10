// lib/realtime/sseConnectionManager.ts

import { SSE_EVENT } from './types'
import {
  handleWhaleIntensityEffect,
  handleWhaleWarningEffect,
} from './whaleEffects'
import { handleRiskUpdate } from './vipEffects'

import { applyRealtimeBollingerSignal } from '@/lib/realtime/useRealtimeBollingerSignal'
import { applyLiveBollingerCommentary } from '@/lib/realtime/useLiveBollingerCommentary'
import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

type Handler = (data: any) => void

type RealtimeTransport = 'vps' | 'vercel'

type RealtimeTokenResponse = {
  ok?: boolean
  url?: unknown
  error?: unknown
}

const REALTIME_SSE_STALE_MS = 55_000
const REALTIME_MARKET_DATA_STALE_MS = 90_000
const REALTIME_SSE_WATCHDOG_INTERVAL_MS = 15_000
const REALTIME_VPS_HANDSHAKE_TIMEOUT_MS = 5_000

const REALTIME_VPS_ENABLED =
  process.env.NEXT_PUBLIC_REALTIME_VPS_ENABLED === 'true'

const REALTIME_SSE_DEBUG =
  process.env.NODE_ENV !== 'production' &&
  process.env.NEXT_PUBLIC_REALTIME_SSE_DEBUG === 'true'

const REALTIME_SSE_SUMMARY_LOG_INTERVAL_MS =
  30_000

const MARKET_DATA_EVENTS = new Set([
  'PRICE_TICK',
  'OI_TICK',
  'VOLUME_TICK',
  'FUNDING_RATE_TICK',
  'WHALE_INTENSITY',
  'WHALE_TRADE_FLOW',
  'WHALE_NET_PRESSURE',
])

const VIP_EVENTS = new Set([
  SSE_EVENT.PRICE_TICK,
  SSE_EVENT.OI_TICK,
  SSE_EVENT.VOLUME_TICK,
  SSE_EVENT.FUNDING_RATE_TICK,
  SSE_EVENT.SENTIMENT_UPDATE,

  'RISK_UPDATE',

  'MARKET_STATE',
  'FINAL_DECISION',

  'FMAI',

  SSE_EVENT.WHALE_INTENSITY,
  SSE_EVENT.WHALE_TRADE_FLOW,
  SSE_EVENT.WHALE_NET_PRESSURE,
  SSE_EVENT.WHALE_ABSORPTION,
  SSE_EVENT.LIQUIDITY_SWEEP,
  SSE_EVENT.MARKET_REGIME,

  SSE_EVENT.BB_SIGNAL,
  SSE_EVENT.BB_LIVE_COMMENTARY,
])

const THROTTLE_EVENTS = new Set([
  SSE_EVENT.PRICE_TICK,
  SSE_EVENT.OI_TICK,
  SSE_EVENT.VOLUME_TICK,
  SSE_EVENT.FUNDING_RATE_TICK,
  SSE_EVENT.SENTIMENT_UPDATE,
])

class SSEConnectionManager {
  private static instance: SSEConnectionManager

  private es: EventSource | null = null
  private handlers = new Map<string, Set<Handler>>()
  private refCount = 0

  private connecting = false
  private transport: RealtimeTransport | null = null
  private connectionCycle = 0
  private vpsFallbackActivated = false

  private tokenAbortController: AbortController | null =
    null

  private vpsHandshakeTimer:
    | ReturnType<typeof setTimeout>
    | null = null

  private reconnectAttempts = 0
  private reconnectTimer:
    | ReturnType<typeof setTimeout>
    | null = null

  private watchdogTimer:
    | ReturnType<typeof setInterval>
    | null = null

  private lastEventAt = 0
  private lastMarketDataAt = 0

  private lastDispatchByType = new Map<string, number>()

  private debugRate = {
    count: 0,
    start: 0,
  }

  private summaryLogAt = 0
  private summaryTypeCount = new Map<string, number>()

  static getInstance() {
    if (!this.instance) {
      this.instance = new SSEConnectionManager()
    }

    return this.instance
  }

  private clearWatchdog() {
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer)
      this.watchdogTimer = null
    }
  }

  private clearVpsHandshakeTimer() {
    if (this.vpsHandshakeTimer) {
      clearTimeout(this.vpsHandshakeTimer)
      this.vpsHandshakeTimer = null
    }
  }

  private clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  private abortTokenRequest() {
    if (this.tokenAbortController) {
      try {
        this.tokenAbortController.abort()
      } catch {}

      this.tokenAbortController = null
    }
  }

  private isCurrentCycle(cycle: number) {
    return (
      cycle === this.connectionCycle &&
      this.refCount > 0
    )
  }

  private isCurrentEventSource(
    cycle: number,
    es: EventSource,
  ) {
    return (
      this.isCurrentCycle(cycle) &&
      this.es === es
    )
  }

  private closeCurrentEventSource() {
    const current = this.es

    this.es = null
    this.transport = null

    if (!current) {
      return
    }

    try {
      current.close()
    } catch {}
  }

  private markConnectionAlive() {
    this.lastEventAt = Date.now()
  }

  private markMarketDataAlive() {
    this.lastMarketDataAt = Date.now()

    try {
      useVIPMarketStore
        .getState()
        .markRealtimeDelayed(false)
    } catch {}
  }

  private markRealtimeDelayed() {
    try {
      useVIPMarketStore
        .getState()
        .markRealtimeDelayed(true)
    } catch {}
  }

  private scheduleReconnect(reason: string) {
    if (this.refCount <= 0) {
      return
    }

    if (this.reconnectTimer) {
      return
    }

    const scheduledCycle = this.connectionCycle

    const delay = Math.min(
      1000 * 2 ** this.reconnectAttempts,
      10000,
    )

    console.warn('[realtime-sse] reconnecting', {
      reason,
      transport:
        this.vpsFallbackActivated
          ? 'vercel'
          : this.transport,
      delay,
      reconnectAttempts: this.reconnectAttempts,
      lastEventAt: this.lastEventAt,
      lastMarketDataAt: this.lastMarketDataAt,
      connectionStaleForMs:
        this.lastEventAt > 0
          ? Date.now() - this.lastEventAt
          : null,
      marketDataStaleForMs:
        this.lastMarketDataAt > 0
          ? Date.now() - this.lastMarketDataAt
          : null,
    })

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null

      if (
        this.refCount <= 0 ||
        scheduledCycle !== this.connectionCycle
      ) {
        return
      }

      this.reconnectAttempts += 1
      this.connect()
    }, delay)
  }

  private fallbackToVercel(
    cycle: number,
    reason: string,
    options?: {
      es?: EventSource
      markDelayed?: boolean
    },
  ) {
    if (!this.isCurrentCycle(cycle)) {
      return
    }

    if (
      options?.es &&
      this.es !== options.es
    ) {
      return
    }

    console.warn('[realtime-sse] fallback', {
      from: 'vps',
      to: 'vercel',
      reason,
      ts: Date.now(),
    })

    this.vpsFallbackActivated = true

    this.clearVpsHandshakeTimer()
    this.clearWatchdog()
    this.abortTokenRequest()

    if (options?.markDelayed) {
      this.markRealtimeDelayed()
    }

    this.closeCurrentEventSource()
    this.connecting = false

    const nextCycle = ++this.connectionCycle

    this.connectVercel(nextCycle)
  }

  private startWatchdog(
    cycle: number,
    es: EventSource,
    transport: RealtimeTransport,
  ) {
    this.clearWatchdog()

    this.watchdogTimer = setInterval(() => {
      if (
        !this.isCurrentEventSource(cycle, es)
      ) {
        return
      }

      const now = Date.now()

      const connectionGap =
        this.lastEventAt > 0
          ? now - this.lastEventAt
          : Number.POSITIVE_INFINITY

      const marketDataGap =
        this.lastMarketDataAt > 0
          ? now - this.lastMarketDataAt
          : Number.POSITIVE_INFINITY

      if (
        connectionGap < REALTIME_SSE_STALE_MS &&
        marketDataGap <
          REALTIME_MARKET_DATA_STALE_MS
      ) {
        return
      }

      const staleReason =
        connectionGap >= REALTIME_SSE_STALE_MS
          ? 'CONNECTION_STALE'
          : 'MARKET_DATA_STALE'

      console.warn('[realtime-sse] stale-detected', {
        reason: staleReason,
        transport,
        connectionGap,
        marketDataGap,
        staleMs: REALTIME_SSE_STALE_MS,
        marketDataStaleMs:
          REALTIME_MARKET_DATA_STALE_MS,
        readyState: es.readyState,
      })

      this.markRealtimeDelayed()

      if (transport === 'vps') {
        this.fallbackToVercel(
          cycle,
          'STALE_WATCHDOG',
          {
            es,
            markDelayed: false,
          },
        )

        return
      }

      this.clearWatchdog()
      this.closeCurrentEventSource()
      this.connecting = false

      this.connectionCycle += 1

      this.scheduleReconnect('STALE_WATCHDOG')
    }, REALTIME_SSE_WATCHDOG_INTERVAL_MS)
  }

  private handleMessage(e: MessageEvent<string>) {
    const now = Date.now()

    this.markConnectionAlive()

    if (!this.debugRate.start) {
      this.debugRate.start = now
    }

    this.debugRate.count++

    if (now - this.debugRate.start > 1000) {
      this.debugRate.count = 0
      this.debugRate.start = now
    }

    let msg: any

    try {
      msg = JSON.parse(e.data)
    } catch {
      return
    }

    const type = msg?.type

    if (!type) {
      return
    }

    if (REALTIME_SSE_DEBUG) {
      const count =
        this.summaryTypeCount.get(type) ?? 0

      this.summaryTypeCount.set(
        type,
        count + 1,
      )

      if (
        now - this.summaryLogAt >=
        REALTIME_SSE_SUMMARY_LOG_INTERVAL_MS
      ) {
        console.log('[realtime-sse] message-summary', {
          ts: now,
          counts: Object.fromEntries(
            this.summaryTypeCount,
          ),
        })

        this.summaryTypeCount.clear()
        this.summaryLogAt = now
      }
    }

    if (MARKET_DATA_EVENTS.has(type)) {
      this.markMarketDataAlive()
    }

    if (type === 'MARKET_STATE') {
    }

    if (type === 'FINAL_DECISION') {
    }

    ;(globalThis as any).__TYPE_COUNT__ =
      (globalThis as any).__TYPE_COUNT__ ?? {}

    ;(globalThis as any).__TYPE_COUNT__[type] =
      ((globalThis as any).__TYPE_COUNT__[type] ??
        0) + 1

    if (!VIP_EVENTS.has(type)) {
      return
    }

    if (THROTTLE_EVENTS.has(type)) {
      const last =
        this.lastDispatchByType.get(type) ?? 0

      if (now - last < 100) {
        return
      }

      this.lastDispatchByType.set(type, now)
    }

    if (type === 'RISK_UPDATE') {
      try {
        handleRiskUpdate(msg)
      } catch {}
    }

    if (type === SSE_EVENT.WHALE_INTENSITY) {
      try {
        handleWhaleIntensityEffect({
          symbol: msg.symbol,
          intensity: msg.intensity,
          avg: msg.avg,
          trend: msg.trend,
          isSpike: msg.isSpike,
          ts: msg.ts ?? Date.now(),
        })
      } catch {}
    }

    if (type === SSE_EVENT.WHALE_WARNING) {
      try {
        handleWhaleWarningEffect({
          symbol: msg.symbol,
          whaleIntensity: msg.whaleIntensity,
          avgWhale: msg.avgWhale,
          tradeUSD: msg.tradeUSD,
          ts: msg.ts ?? Date.now(),
        })
      } catch {}
    }

    if (type === SSE_EVENT.BB_SIGNAL) {
      try {
        applyRealtimeBollingerSignal(msg)
      } catch {}
    }

    if (
      type === SSE_EVENT.BB_LIVE_COMMENTARY
    ) {
      try {
        applyLiveBollingerCommentary(msg)
      } catch {}
    }

    this.handlers
      .get(type)
      ?.forEach((handler) => {
        try {
          handler(msg)
        } catch {}
      })

    this.handlers
      .get('*')
      ?.forEach((handler) => {
        try {
          handler(msg)
        } catch {}
      })
  }

  private bindEventSourceHandlers(
    es: EventSource,
    transport: RealtimeTransport,
    cycle: number,
  ) {
    es.onopen = () => {
      if (
        !this.isCurrentEventSource(cycle, es)
      ) {
        return
      }

      const wasReconnect =
        this.reconnectAttempts > 0

      this.markConnectionAlive()

      console.log('[realtime-sse] open', {
        ts: this.lastEventAt,
        wasReconnect,
        transport,
      })

      if (wasReconnect) {
        console.log(
          '[realtime-sse] reconnect-success',
          {
            ts: this.lastEventAt,
            reconnectAttempts:
              this.reconnectAttempts,
            transport,
          },
        )
      }

      this.reconnectAttempts = 0

      this.startWatchdog(
        cycle,
        es,
        transport,
      )
    }

    if (transport === 'vps') {
      es.addEventListener('connected', () => {
        if (
          !this.isCurrentEventSource(
            cycle,
            es,
          )
        ) {
          return
        }

        this.clearVpsHandshakeTimer()
        this.markConnectionAlive()

        console.log('[realtime-sse] connected', {
          ts: this.lastEventAt,
          transport,
        })
      })
    }

    es.addEventListener('ping', () => {
      if (
        !this.isCurrentEventSource(cycle, es)
      ) {
        return
      }

      this.markConnectionAlive()

      if (REALTIME_SSE_DEBUG) {
        console.log('[realtime-sse] ping', {
          ts: this.lastEventAt,
          transport,
        })
      }
    })

    es.onmessage = (e) => {
      if (
        !this.isCurrentEventSource(cycle, es)
      ) {
        return
      }

      this.handleMessage(e)
    }

    es.onerror = () => {
      if (
        !this.isCurrentEventSource(cycle, es)
      ) {
        return
      }

      console.warn('[realtime-sse] error', {
        ts: Date.now(),
        readyState: es.readyState,
        transport,
      })

      if (transport === 'vps') {
        this.fallbackToVercel(
          cycle,
          'EVENTSOURCE_ERROR',
          {
            es,
            markDelayed: true,
          },
        )

        return
      }

      this.clearWatchdog()
      this.clearVpsHandshakeTimer()

      this.closeCurrentEventSource()
      this.connecting = false

      this.markRealtimeDelayed()

      this.connectionCycle += 1

      this.scheduleReconnect(
        'EVENTSOURCE_ERROR',
      )
    }
  }

  private connectVercel(cycle: number) {
    if (!this.isCurrentCycle(cycle)) {
      this.connecting = false
      return
    }

    if (this.es) {
      this.connecting = false
      return
    }

    this.abortTokenRequest()
    this.clearVpsHandshakeTimer()

    try {
      const es = new EventSource(
        '/api/realtime/stream?scope=vip',
      )

      if (!this.isCurrentCycle(cycle)) {
        try {
          es.close()
        } catch {}

        this.connecting = false
        return
      }

      this.es = es
      this.transport = 'vercel'
      this.connecting = false

      this.bindEventSourceHandlers(
        es,
        'vercel',
        cycle,
      )
    } catch (error) {
      if (!this.isCurrentCycle(cycle)) {
        this.connecting = false
        return
      }

      console.warn('[realtime-sse] error', {
        ts: Date.now(),
        readyState: null,
        transport: 'vercel',
        reason: 'EVENTSOURCE_CREATE_FAILED',
        error,
      })

      this.es = null
      this.transport = null
      this.connecting = false

      this.markRealtimeDelayed()

      this.connectionCycle += 1

      this.scheduleReconnect(
        'EVENTSOURCE_CREATE_FAILED',
      )
    }
  }

  private async connectVpsFirst(
    cycle: number,
  ) {
    const controller = new AbortController()

    this.tokenAbortController = controller

    try {
      const response = await fetch(
        '/api/realtime/token?scope=vip',
        {
          method: 'GET',
          credentials: 'same-origin',
          cache: 'no-store',
          signal: controller.signal,
        },
      )

      if (!this.isCurrentCycle(cycle)) {
        return
      }

      if (!response.ok) {
        this.fallbackToVercel(
          cycle,
          `TOKEN_HTTP_${response.status}`,
        )

        return
      }

      let tokenResponse: RealtimeTokenResponse

      try {
        tokenResponse =
          (await response.json()) as RealtimeTokenResponse
      } catch {
        this.fallbackToVercel(
          cycle,
          'TOKEN_JSON_ERROR',
        )

        return
      }

      if (!this.isCurrentCycle(cycle)) {
        return
      }

      if (
        tokenResponse.ok !== true ||
        typeof tokenResponse.url !== 'string' ||
        !tokenResponse.url
      ) {
        this.fallbackToVercel(
          cycle,
          'TOKEN_URL_MISSING',
        )

        return
      }

      const es = new EventSource(
        tokenResponse.url,
      )

      if (!this.isCurrentCycle(cycle)) {
        try {
          es.close()
        } catch {}

        return
      }

      this.tokenAbortController = null
      this.es = es
      this.transport = 'vps'
      this.connecting = false

      this.bindEventSourceHandlers(
        es,
        'vps',
        cycle,
      )

      this.clearVpsHandshakeTimer()

      this.vpsHandshakeTimer = setTimeout(() => {
        if (
          !this.isCurrentEventSource(
            cycle,
            es,
          )
        ) {
          return
        }

        this.fallbackToVercel(
          cycle,
          'VPS_HANDSHAKE_TIMEOUT',
          {
            es,
            markDelayed: true,
          },
        )
      }, REALTIME_VPS_HANDSHAKE_TIMEOUT_MS)
    } catch (error) {
      if (!this.isCurrentCycle(cycle)) {
        return
      }

      const errorName =
        typeof error === 'object' &&
        error !== null &&
        'name' in error
          ? String(
              (error as { name?: unknown }).name,
            )
          : ''

      if (
        errorName === 'AbortError' &&
        this.refCount <= 0
      ) {
        return
      }

      this.fallbackToVercel(
        cycle,
        errorName === 'AbortError'
          ? 'TOKEN_FETCH_ABORTED'
          : 'TOKEN_FETCH_FAILED',
      )
    } finally {
      if (
        this.tokenAbortController ===
        controller
      ) {
        this.tokenAbortController = null
      }
    }
  }

  private connect() {
    if (this.refCount <= 0) {
      return
    }

    if (this.es || this.connecting) {
      return
    }

    this.connecting = true

    const cycle = ++this.connectionCycle

    if (
      REALTIME_VPS_ENABLED &&
      !this.vpsFallbackActivated
    ) {
      void this.connectVpsFirst(cycle)
      return
    }

    this.connectVercel(cycle)
  }

  subscribe(type: string, handler: Handler) {
    this.refCount++

    this.connect()

    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }

    this.handlers.get(type)!.add(handler)

    return () => {
      this.handlers.get(type)?.delete(handler)

      this.refCount = Math.max(
        0,
        this.refCount - 1,
      )

      if (this.refCount === 0) {
        this.connectionCycle += 1

        this.abortTokenRequest()
        this.clearVpsHandshakeTimer()
        this.clearReconnectTimer()
        this.clearWatchdog()

        this.closeCurrentEventSource()

        this.connecting = false
        this.transport = null
        this.vpsFallbackActivated = false

        this.reconnectAttempts = 0

        this.lastEventAt = 0
        this.lastMarketDataAt = 0

        this.debugRate = {
          count: 0,
          start: 0,
        }

        this.summaryLogAt = 0
        this.summaryTypeCount.clear()
        this.lastDispatchByType.clear()
      }
    }
  }
}

export const sseManager =
  SSEConnectionManager.getInstance()
  