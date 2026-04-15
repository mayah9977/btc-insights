import { SSE_EVENT } from './types'
import {
  handleWhaleIntensityEffect,
  handleWhaleWarningEffect,
} from './whaleEffects'
import { handleRiskUpdate } from './vipEffects'

import { applyRealtimeBollingerSignal } from '@/lib/realtime/useRealtimeBollingerSignal'
import { applyLiveBollingerCommentary } from '@/lib/realtime/useLiveBollingerCommentary'

type Handler = (data: any) => void

/* =========================================================
🔥 VIP EVENT LIST
========================================================= */

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

  private lastDispatchByType = new Map<string, number>()

  private debugRate = { count: 0, start: 0 }

  static getInstance() {
    if (!this.instance) {
      this.instance = new SSEConnectionManager()
    }
    return this.instance
  }

  /* =========================
  🔌 Connect
  ========================= */

  private connect() {
    if (this.es) return

    this.es = new EventSource('/api/realtime/stream?scope=vip')

    this.es.onopen = () => {
      this.reconnectAttempts = 0
    }

    this.es.onmessage = (e) => {
      const now = Date.now()

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

      if (type === 'MARKET_STATE') {
      }

      if (type === 'FINAL_DECISION') {
      }

      ;(globalThis as any).__TYPE_COUNT__ =
        (globalThis as any).__TYPE_COUNT__ ?? {}

      ;(globalThis as any).__TYPE_COUNT__[type] =
        ((globalThis as any).__TYPE_COUNT__[type] ?? 0) + 1

      /* =========================
      VIP EVENT FILTER
      ========================= */

      if (!VIP_EVENTS.has(type)) {
        return
      }

      /* =========================
      Throttle
      ========================= */

      if (THROTTLE_EVENTS.has(type)) {
        const last = this.lastDispatchByType.get(type) ?? 0

        if (now - last < 100) {
          return
        }

        this.lastDispatchByType.set(type, now)
      }

      /* =========================
      VIP Risk
      ========================= */

      if (type === 'RISK_UPDATE') {
        try {
          handleRiskUpdate(msg)
        } catch {}
      }

      /* =========================
      Whale Effects
      ========================= */

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

      /* =========================
      Bollinger
      ========================= */

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

      /* =========================
      Fan-out
      ========================= */

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

    /* =========================
    Auto Reconnect
    ========================= */

    this.es.onerror = () => {
      this.es?.close()
      this.es = null

      const delay = Math.min(
        1000 * 2 ** this.reconnectAttempts,
        10000,
      )

      this.reconnectTimer = setTimeout(() => {
        this.reconnectAttempts++
        this.connect()
      }, delay)
    }
  }

  /* =========================
  🔔 Subscribe
  ========================= */

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
        }

        this.es?.close()
        this.es = null
      }
    }
  }
}

export const sseManager = SSEConnectionManager.getInstance() 
