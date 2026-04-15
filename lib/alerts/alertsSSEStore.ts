// /lib/alerts/alertsSSEStore.ts
'use client'

import { create } from 'zustand'
import { toast } from 'react-hot-toast'
import { sseManager } from '@/lib/realtime/sseConnectionManager'
import { SSE_EVENT } from '@/lib/realtime/types'

export type SystemRiskLevel = 'SAFE' | 'WARNING' | 'CRITICAL'

type AlertsSSEState = {
  connected: boolean
  systemRisk: SystemRiskLevel
  lastEventAt: number | null
  bootstrap: () => void
  shutdown: () => void
}

let unsubscribe: (() => void) | null = null
let watchdogTimer: ReturnType<typeof setInterval> | null = null

export const useAlertsSSEStore = create<AlertsSSEState>(
  (set, get) => ({
    connected: false,
    systemRisk: 'SAFE',
    lastEventAt: null,

    /* =========================
     * 🔥 Bootstrap (subscribe)
     * ========================= */
    bootstrap: () => {
      if (typeof window === 'undefined') return
      if (unsubscribe) return // already bootstrapped

      console.log('[alerts-sse] bootstrap (manager)')
      console.log('[alerts-sse] manager-ready:', !!sseManager)

      const es = new EventSource('/api/alerts/sse')

      es.onopen = () => {
        console.log('[alerts-sse] connected: /api/alerts/sse')

        set({
          connected: true,
          systemRisk: 'SAFE',
          lastEventAt: Date.now(),
        })
      }

      es.onmessage = (event) => {
        let data: any

        try {
          data = JSON.parse(event.data)
        } catch (error) {
          console.error('[alerts-sse] parse error:', error)
          return
        }

        console.log('SSE RAW DATA:', data)

        set({
          connected: true,
          systemRisk: 'SAFE',
          lastEventAt: Date.now(),
        })

        if (data?.type === 'ALERT_TRIGGERED') {
          /* 🔒 Payload normalization (Zustand 호환) */
          const payload = {
            type: 'ALERT_TRIGGERED',
            alertId: data.alertId,
            symbol: data.symbol,
            price: data.price,
            ts: data.ts ?? Date.now(),
          }

          console.log('SSE PAYLOAD:', payload)

          /* 🔔 Toast */
          toast.success(
            `🔔 ${payload.symbol} 알림 발생\n가격: ${payload.price}`,
            {
              position: 'bottom-right',
              duration: 5000,
            },
          )

          /* 🔥 기존 UI 호환 이벤트 유지 */
          window.dispatchEvent(
            new CustomEvent('alerts:sse', {
              detail: payload,
            }),
          )

          window.dispatchEvent(
            new CustomEvent('alert:triggered', {
              detail: payload,
            }),
          )
        }

        if (data?.type === 'INDICATOR_SIGNAL') {
          console.log('INDICATOR SIGNAL:', data)

          window.dispatchEvent(
            new CustomEvent('alerts:sse', {
              detail: data,
            }),
          )
        }
      }

      es.onerror = (error) => {
        console.error('[alerts-sse] connection error:', error)

        set({
          connected: false,
          systemRisk: 'CRITICAL',
        })
      }

      unsubscribe = () => {
        es.close()
      }

      /* =========================
       * 💓 Watchdog
       * ========================= */
      watchdogTimer = setInterval(() => {
        const last = get().lastEventAt
        if (!last) return

        const gap = Date.now() - last

        if (gap > 10_000) {
          set({
            connected: false,
            systemRisk: 'CRITICAL',
          })
        } else if (gap > 5_000) {
          set({
            connected: true,
            systemRisk: 'WARNING',
          })
        }
      }, 5_000)
    },

    /* =========================
     * 🔌 Shutdown
     * ========================= */
    shutdown: () => {
      if (unsubscribe) {
        unsubscribe()
        unsubscribe = null
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
  }),
)
