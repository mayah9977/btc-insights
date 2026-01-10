'use client'

import { create } from 'zustand'
import { toast } from 'react-hot-toast'

let sse: EventSource | null = null
let watchdogTimer: ReturnType<typeof setInterval> | null = null

export type SystemRiskLevel = 'SAFE' | 'WARNING' | 'CRITICAL'

type AlertsSSEState = {
  connected: boolean
  systemRisk: SystemRiskLevel
  lastEventAt: number | null
  bootstrap: () => void
  shutdown: () => void
}

export const useAlertsSSEStore = create<AlertsSSEState>((set, get) => ({
  connected: false,
  systemRisk: 'SAFE',
  lastEventAt: null,

  /* =========================
   * 🔥 SSE Bootstrap
   * ========================= */
  bootstrap: () => {
    if (typeof window === 'undefined') return

    // HMR / Fast Refresh 안전 처리
    if (sse) {
      try {
        sse.close()
      } catch {}
      sse = null
    }

    console.log('[alerts-sse] bootstrap start')

    sse = new EventSource('/api/alerts/sse')

    sse.onopen = () => {
      set({
        connected: true,
        systemRisk: 'SAFE',
        lastEventAt: Date.now(),
      })
    }

    sse.onerror = err => {
      console.warn('[SSE][ALERTS] error (ignored)', err)
    }

    sse.onmessage = event => {
      try {
        const data = JSON.parse(event.data)

        set({
          connected: true,
          systemRisk: 'SAFE',
          lastEventAt: Date.now(),
        })

        if (data?.type === 'ALERT_TRIGGERED') {
          /* =========================
           * 🔔 Toast
           * ========================= */
          toast.success(
            `🔔 ${data.symbol} 알림 발생\n가격: ${data.price}`,
            {
              position: 'bottom-right',
              duration: 5000,
            },
          )

          /* =========================
           * 🔥 Method 1 핵심
           * - Alert 카드 Store로 전달
           * ========================= */
          window.dispatchEvent(
            new CustomEvent('alerts:sse', { detail: data }),
          )

          /* =========================
           * 기존 UI/호환 이벤트 (유지)
           * ========================= */
          window.dispatchEvent(
            new CustomEvent('alert:triggered', { detail: data }),
          )
        }
      } catch (e) {
        console.error('[SSE] parse error', e)
      }
    }

    /* =========================
     * 💓 Watchdog
     * ========================= */
    watchdogTimer = setInterval(() => {
      const last = get().lastEventAt
      if (!last) return

      const gap = Date.now() - last
      if (gap > 10_000) {
        set({ connected: false, systemRisk: 'CRITICAL' })
      } else if (gap > 5_000) {
        set({ connected: true, systemRisk: 'WARNING' })
      }
    }, 5_000)
  },

  /* =========================
   * 🔌 Shutdown
   * ========================= */
  shutdown: () => {
    if (sse) {
      try {
        sse.close()
      } catch {}
      sse = null
    }

    if (watchdogTimer) {
      clearInterval(watchdogTimer)
      watchdogTimer = null
    }

    set({
      connected: false,
      systemRisk: 'SAFE',
      lastEventAt: null,
    })
  },
}))
