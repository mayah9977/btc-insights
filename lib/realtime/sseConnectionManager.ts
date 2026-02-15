// lib/realtime/sseConnectionManager.ts

import { SSE_EVENT } from './types'
import {
  handleWhaleIntensityEffect,
  handleWhaleWarningEffect,
} from './whaleEffects'
import { handleRiskUpdate } from './vipEffects'

type Handler = (data: any) => void

// ✅ Market 계열 이벤트 (전달 보장 대상)
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

  static getInstance() {
    if (!this.instance) {
      this.instance = new SSEConnectionManager()
    }
    return this.instance
  }

  private connect() {
    if (this.es) return

    this.es = new EventSource('/api/realtime/stream')

    this.es.onmessage = (e) => {
      let msg: any
      try {
        msg = JSON.parse(e.data)
      } catch {
        return
      }

      const type = msg?.type
      if (!type) return

      /* =========================
       * 🔇 로그 폭주 최소 차단
       * - Market 이벤트는 RAW 로그 제외
       * ========================= */
      if (
        process.env.NODE_ENV !== 'production' &&
        !MARKET_EVENTS.has(type)
      ) {
        console.log('[SSE RAW]', msg)
      }

      /* =========================
       * 🔥 VIP RISK UPDATE
       * ========================= */
      if (type === 'RISK_UPDATE') {
        try {
          handleRiskUpdate(msg)
        } catch (err) {
          console.error('[RISK_UPDATE error]', err)
        }
      }

      /* =========================
       * 🐋 Whale Side Effects
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
       * 📡 Fan-out to subscribers
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

    this.es.onerror = (err) => {
      console.error('[SSE] connection error', err)
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
      this.refCount--
      if (this.refCount <= 0) {
        this.es?.close()
        this.es = null
      }
    }
  }
}

export const sseManager = SSEConnectionManager.getInstance()
