'use client'

import { create } from 'zustand'

/**
 * ======================================================
 * 🔒 ALERTS SSE SINGLETON (SSE 인프라 전용 Store)
 * ======================================================
 */

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

  bootstrap: () => {
    // 🚫 SSR 방어
    if (typeof window === 'undefined') return

    // 🔒 중복 생성 방지
    if (sse) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[alerts-sse] bootstrap skipped (already exists)')
      }
      return
    }

    console.log('[alerts-sse] bootstrap start')

    sse = new EventSource('/api/alerts/sse')

    /** ✅ 연결 성공 */
    sse.onopen = () => {
      console.log('[SSE][ALERTS] connected')
      set({
        connected: true,
        systemRisk: 'SAFE',
        lastEventAt: Date.now(),
      })
    }

    /**
     * ⚠️ onerror는 실제 disconnect 아님
     * - 자동 재연결됨
     * - 상태 변경 ❌
     */
    sse.onerror = (err) => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[SSE][ALERTS] error (ignored)', err)
      }
    }

    /** 📩 메시지 수신 */
    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        set({
          lastEventAt: Date.now(),
          connected: true,
          systemRisk: 'SAFE',
        })

        // 🔥 ALERT_TRIGGERED fan-out
        if (data?.type === 'ALERT_TRIGGERED') {
          window.dispatchEvent(
            new CustomEvent('alert:triggered', { detail: data }),
          )
        }
      } catch (err) {
        console.error('[SSE][ALERTS] message parse error', err)
      }
    }

    /**
     * 🕒 Watchdog
     * - 5~10s 무응답 → WARNING
     * - 10s 초과 → CRITICAL
     */
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

  /**
   * 🔚 앱 완전 종료 시에만 사용
   */
  shutdown: () => {
    if (sse) {
      console.log('[alerts-sse] shutdown')
      sse.close()
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
