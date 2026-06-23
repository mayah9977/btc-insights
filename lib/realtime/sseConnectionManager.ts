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

const REALTIME_SSE_STALE_MS = 55_000
const REALTIME_MARKET_DATA_STALE_MS = 90_000
const REALTIME_SSE_WATCHDOG_INTERVAL_MS = 15_000
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

  private reconnectAttempts = 0
  private reconnectTimer: any = null
  private watchdogTimer: any = null
  private lastEventAt = 0
  private lastMarketDataAt = 0

  private lastDispatchByType = new Map<string, number>()

  private debugRate = { count: 0, start: 0 }
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

    const delay = Math.min(
      1000 * 2 ** this.reconnectAttempts,
      10000,
    )

    console.warn('[realtime-sse] reconnecting', {
      reason,
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
      this.reconnectAttempts += 1
      this.connect()
    }, delay)
  }

  private startWatchdog() {
    this.clearWatchdog()

    this.watchdogTimer = setInterval(() => {
      if (!this.es) {
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

      console.warn('[realtime-sse] stale-detected', {
        reason:
          connectionGap >= REALTIME_SSE_STALE_MS
            ? 'CONNECTION_STALE'
            : 'MARKET_DATA_STALE',
        connectionGap,
        marketDataGap,
        staleMs: REALTIME_SSE_STALE_MS,
        marketDataStaleMs:
          REALTIME_MARKET_DATA_STALE_MS,
        readyState: this.es.readyState,
      })

      this.markRealtimeDelayed()

      try {
        this.es.close()
      } catch {}

      this.es = null

      this.scheduleReconnect('STALE_WATCHDOG')
    }, REALTIME_SSE_WATCHDOG_INTERVAL_MS)
  }

  private connect() {
    if (this.es) return

    this.es = new EventSource('/api/realtime/stream?scope=vip')

    this.es.onopen = () => {
      const wasReconnect = this.reconnectAttempts > 0

      this.markConnectionAlive()

      console.log('[realtime-sse] open', {
        ts: this.lastEventAt,
        wasReconnect,
      })

      if (wasReconnect) {
        console.log('[realtime-sse] reconnect-success', {
          ts: this.lastEventAt,
          reconnectAttempts: this.reconnectAttempts,
        })
      }

      this.reconnectAttempts = 0

      this.startWatchdog()
    }

    this.es.addEventListener('ping', () => {
      this.markConnectionAlive()

      if (REALTIME_SSE_DEBUG) {
        console.log('[realtime-sse] ping', {
          ts: this.lastEventAt,
        })
      }
    })

    this.es.onmessage = (e) => {
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
      if (!type) return

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
        ((globalThis as any).__TYPE_COUNT__[type] ?? 0) + 1

      if (!VIP_EVENTS.has(type)) {
        return
      }

      if (THROTTLE_EVENTS.has(type)) {
        const last = this.lastDispatchByType.get(type) ?? 0

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

      if (type === SSE_EVENT.BB_LIVE_COMMENTARY) {
        try {
          applyLiveBollingerCommentary(msg)
        } catch {}
      }

      this.handlers.get(type)?.forEach((handler) => {
        try {
          handler(msg)
        } catch {}
      })

      this.handlers.get('*')?.forEach((handler) => {
        try {
          handler(msg)
        } catch {}
      })
    }

    this.es.onerror = () => {
      console.warn('[realtime-sse] error', {
        ts: Date.now(),
        readyState: this.es?.readyState,
      })

      this.es?.close()
      this.es = null

      this.markRealtimeDelayed()

      this.scheduleReconnect('EVENTSOURCE_ERROR')
    }
  }

  subscribe(type: string, handler: Handler) {
    this.connect()

    this.refCount++

    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }

    this.handlers.get(type)!.add(handler)

    return () => {
      this.handlers.get(type)?.delete(handler)

      this.refCount = Math.max(0, this.refCount - 1)

      if (this.refCount === 0) {
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer)
          this.reconnectTimer = null
        }

        this.clearWatchdog()

        this.es?.close()
        this.es = null
        this.lastEventAt = 0
        this.lastMarketDataAt = 0
        this.summaryLogAt = 0
        this.summaryTypeCount.clear()
        this.lastDispatchByType.clear()
      }
    }
  }
}

export const sseManager = SSEConnectionManager.getInstance()
