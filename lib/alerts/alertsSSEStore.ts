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

      unsubscribe = sseManager.subscribe(
        SSE_EVENT.ALERT_TRIGGERED ?? 'ALERT_TRIGGERED',
        (data: any) => {
          set({
            connected: true,
            systemRisk: 'SAFE',
            lastEventAt: Date.now(),
          })

          /* 🔔 Toast */
          toast.success(
            `🔔 ${data.symbol} 알림 발생\n가격: ${data.price}`,
            {
              position: 'bottom-right',
              duration: 5000,
            },
          )

          /* 🔥 기존 UI 호환 이벤트 유지 */
          window.dispatchEvent(
            new CustomEvent('alerts:sse', {
              detail: data,
            }),
          )
          window.dispatchEvent(
            new CustomEvent('alert:triggered', {
              detail: data,
            }),
          )
        },
      )

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
