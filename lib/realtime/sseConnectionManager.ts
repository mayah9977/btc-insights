import { SSE_EVENT } from './types'
import {
  handleWhaleIntensityEffect,
  handleWhaleWarningEffect,
} from './whaleEffects'
import { handleRiskUpdate } from './vipEffects'

import { applyRealtimeBollingerSignal } from '@/lib/realtime/useRealtimeBollingerSignal'
import { applyLiveBollingerCommentary } from '@/lib/realtime/useLiveBollingerCommentary'

type Handler = (data: any) => void

const MARKET_EVENTS = new Set([
  'PRICE_TICK',
  'OI_TICK',
  'VOLUME_TICK',
  'FUNDING_RATE_TICK',
])

class SSEConnectionManager {
  private static instance: SSEConnectionManager
  private es: EventSource | null = null
  private handlers = new Map<string, Set<Handler>>()
  private refCount = 0

  // 🔥 재연결 관리
  private reconnectAttempts = 0
  private reconnectTimer: any = null
  private scope: 'realtime' | 'vip' = 'realtime'

  static getInstance() {
    if (!this.instance) {
      this.instance = new SSEConnectionManager()
    }
    return this.instance
  }

  /* =========================
   * 🔌 Connect
   * ========================= */
  private connect() {
    if (this.es) return

    const url =
      this.scope === 'vip'
        ? '/api/realtime/stream?scope=vip'
        : '/api/realtime/stream'

    this.es = new EventSource(url)

    this.es.onopen = () => {
      this.reconnectAttempts = 0
      if (process.env.NODE_ENV !== 'production') {
        console.log('[SSE] connected:', this.scope)
      }
    }

    this.es.onmessage = (e) => {
      let msg: any

      try {
        msg = JSON.parse(e.data)
      } catch {
        return
      }

      const type = msg?.type
      if (!type) return

      if (
        process.env.NODE_ENV !== 'production' &&
        !MARKET_EVENTS.has(type)
      ) {
        console.log('[SSE RAW]', msg)
      }

      /* =========================
       * VIP
       * ========================= */
      if (type === 'RISK_UPDATE') {
        try {
          handleRiskUpdate(msg)
        } catch (err) {
          console.error('[RISK_UPDATE error]', err)
        }
      }

      /* =========================
       * Whale Effects
       * ========================= */
      if (type === SSE_EVENT.WHALE_INTENSITY) {
        handleWhaleIntensityEffect({
          symbol: msg.symbol,
          intensity: msg.intensity,
          avg: msg.avg,
          trend: msg.trend,
          isSpike: msg.isSpike,
          ts: msg.ts ?? Date.now(),
        })
      }

      if (type === SSE_EVENT.WHALE_WARNING) {
        handleWhaleWarningEffect({
          symbol: msg.symbol,
          whaleIntensity: msg.whaleIntensity,
          avgWhale: msg.avgWhale,
          tradeUSD: msg.tradeUSD,
          ts: msg.ts ?? Date.now(),
        })
      }

      /* =========================
       * Bollinger
       * ========================= */
      if (type === SSE_EVENT.BB_SIGNAL) {
        try {
          applyRealtimeBollingerSignal(msg)
        } catch (err) {
          console.error('[BB_SIGNAL error]', err)
        }
      }

      if (type === SSE_EVENT.BB_LIVE_COMMENTARY) {
        try {
          applyLiveBollingerCommentary(msg)
        } catch (err) {
          console.error('[BB_LIVE_COMMENTARY error]', err)
        }
      }

      /* =========================
       * Fan-out
       * ========================= */
      this.handlers.get(type)?.forEach((handler) => {
        try {
          handler(msg)
        } catch (err) {
          console.error('[SSE handler error]', type, err)
        }
      })

      this.handlers.get('*')?.forEach((handler) => {
        try {
          handler(msg)
        } catch (err) {
          console.error('[SSE wildcard handler error]', type, err)
        }
      })
    }

    /* =========================
     * 🔁 Auto Reconnect (Exponential Backoff)
     * ========================= */
    this.es.onerror = () => {
      this.es?.close()
      this.es = null

      const delay = Math.min(
        1000 * 2 ** this.reconnectAttempts,
        10000
      )

      if (process.env.NODE_ENV !== 'production') {
        console.warn('[SSE] reconnecting in', delay, 'ms')
      }

      this.reconnectTimer = setTimeout(() => {
        this.reconnectAttempts++
        this.connect()
      }, delay)
    }
  }

  /* =========================
   * 🔔 Subscribe
   * ========================= */
  subscribe(type: string, handler: Handler, options?: { scope?: 'vip' }) {
    if (options?.scope === 'vip') {
      this.scope = 'vip'
    }

    this.connect()
    this.refCount++

    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set())
    }

    this.handlers.get(type)!.add(handler)

    return () => {
      this.handlers.get(type)?.delete(handler)
      this.refCount--

      if (this.refCount <= 0) {
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
