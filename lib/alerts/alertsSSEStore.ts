// /lib/alerts/alertsSSEStore.ts
'use client'

import { create } from 'zustand'
import { sseManager } from '@/lib/realtime/sseConnectionManager'
import { SSE_EVENT } from '@/lib/realtime/types'
import { getUserNotificationSettings } from '@/lib/notification/settingsStore'
import { getUserVIP } from '@/lib/auth/getUserVIP'
import {
  renderAlertToast,
  renderIndicatorToast,
} from '@/app/[locale]/alerts/components/AlertToastRenderer' // 🔧 추가: renderer 사용

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

let soundInterval: ReturnType<typeof setInterval> | null = null
let vibrationInterval: ReturnType<typeof setInterval> | null = null

let audioInstance: HTMLAudioElement | null = null

let notificationLoopToken = 0
let notificationLoopLock: Promise<void> | null = null

let isNotificationLoopRunning = false

export function stopNotificationLoop() {
  notificationLoopToken += 1

  isNotificationLoopRunning = false

  if (soundInterval) {
    clearInterval(soundInterval)
    soundInterval = null
  }

  if (vibrationInterval) {
    clearInterval(vibrationInterval)
    vibrationInterval = null
  }

  try {
    navigator.vibrate?.(0)
  } catch {}

  if (audioInstance) {
    try {
      audioInstance.pause()
      audioInstance.currentTime = 0
      audioInstance.src = ''
      audioInstance.load()
    } catch {}
    audioInstance = null
  }

  if (typeof document !== 'undefined') {
    const audios = document.querySelectorAll('audio')
    audios.forEach(audio => {
      try {
        audio.pause()
        audio.currentTime = 0
        audio.src = ''
        audio.load()
      } catch {}
    })
  }
}

function getSoundFilePath(soundType: string) {
  const SOUND_MAP: Record<string, string> = {
    default: '/sounds/default.mp3',
    alert1: '/sounds/alert1.mp3',
    alert2: '/sounds/alert2.mp3',
    siren: '/sounds/siren.mp3',
  }

  return SOUND_MAP[soundType] ?? SOUND_MAP.default
}

async function startNotificationLoop() {
  if (isNotificationLoopRunning) {
    return
  }

  if (notificationLoopLock) {
    await notificationLoopLock
  }

  let resolveLock: () => void
  notificationLoopLock = new Promise<void>(resolve => {
    resolveLock = resolve
  })

  try {
    isNotificationLoopRunning = true

    const currentToken = ++notificationLoopToken

    stopNotificationLoop()

    const settings = await getUserNotificationSettings('local')

    if (currentToken !== notificationLoopToken - 1) return

    if (settings.soundEnabled) {
      try {
        const audio = new Audio(getSoundFilePath(settings.soundType))
        audio.loop = true
        audio.preload = 'auto'

        if (currentToken !== notificationLoopToken - 1) {
          try {
            audio.pause()
            audio.currentTime = 0
            audio.src = ''
            audio.load()
          } catch {}
          return
        }

        audioInstance = audio
        void audio.play().catch(() => {})
      } catch {
        audioInstance = null
      }
    }

    if (settings.vibrationEnabled && 'vibrate' in navigator) {
      if (currentToken !== notificationLoopToken - 1) return

      vibrationInterval = setInterval(() => {
        navigator.vibrate?.([200, 100, 200])
      }, 1500)
    }
  } finally {
    notificationLoopLock = null
    resolveLock!()
  }
}

export const useAlertsSSEStore = create<AlertsSSEState>(
  (set, get) => ({
    connected: false,
    systemRisk: 'SAFE',
    lastEventAt: null,

    bootstrap: () => {
      if (typeof window === 'undefined') return
      if (unsubscribe) return

      console.log('[alerts-sse] bootstrap (manager)')
      console.log('[alerts-sse] manager-ready:', !!sseManager)
      console.log('[alerts-sse] SSE_EVENT ready:', !!SSE_EVENT)

      const es = new EventSource('/api/alerts/sse')

      es.onopen = () => {
        console.log('[alerts-sse] connected: /api/alerts/sse')

        set({
          connected: true,
          systemRisk: 'SAFE',
          lastEventAt: Date.now(),
        })
      }

      es.onmessage = async (event) => {
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
          const payload = {
            type: 'ALERT_TRIGGERED',
            alertId: data.alertId,
            symbol: data.symbol,
            price: data.price,
            ts: data.ts ?? Date.now(),
          }

          console.log('SSE PAYLOAD:', payload)

          // 🔧 변경: toast.success → custom renderer
          renderAlertToast({
            symbol: payload.symbol,
            price: payload.price,
          })

          // 🔧 유지: 저장 API
          void fetch('/api/notification/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: String(payload.alertId),
              type: 'BTC_ALERT',
              title: `${payload.symbol} price notification`,
              body: `Price ${payload.price} reached`,
              createdAt: payload.ts,
            }),
          })

          void startNotificationLoop()

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

          const isVIP = await getUserVIP('local')
          if (!isVIP) {
            return
          }

          const settings = await getUserNotificationSettings('local')

          const indicator =
            data.indicator as keyof typeof settings.indicatorEnabled

          if (
            settings.indicatorEnabled &&
            settings.indicatorEnabled[indicator] === false
          ) {
            return
          }

          const SIGNAL_MAP: Record<string, Record<string, string>> = {
            RSI: {
              RSI_OVERBOUGHT: 'RSI 과매수 진입',
              RSI_OVERSOLD: 'RSI 과매도 진입',
            },
            MACD: {
              GOLDEN_CROSS: 'MACD 골든크로스',
              DEAD_CROSS: 'MACD 데드크로스',
            },
            EMA: {
              BULLISH_TREND: 'EMA 상승 전환',
              BEARISH_TREND: 'EMA 하락 추세',
            },
          }

          const label =
            SIGNAL_MAP[data.indicator]?.[data.signal] ??
            `${data.indicator} ${data.signal}`

          // 🔧 변경: toast.success → custom renderer
          renderIndicatorToast({
            symbol: data.symbol,
            indicator: data.indicator,
            label: label,
            signal: data.signal,
            value: Number(data.value),
          })

          // 🔧 유지: 저장 API
          void fetch('/api/notification/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: `${data.symbol}-${data.signal}-${Date.now()}`,
              type: 'INDICATOR',
              title: `${data.indicator} signal`,
              body: label,
              createdAt: Date.now(),
            }),
          })

          void startNotificationLoop()

          window.dispatchEvent(
            new CustomEvent('alerts:sse', {
              detail: data,
            }),
          )

          window.dispatchEvent(
            new CustomEvent('indicator:triggered', {
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

    shutdown: () => {
      if (unsubscribe) {
        unsubscribe()
        unsubscribe = null
      }

      if (watchdogTimer) {
        clearInterval(watchdogTimer)
        watchdogTimer = null
      }

      stopNotificationLoop()

      set({
        connected: false,
        systemRisk: 'SAFE',
        lastEventAt: null,
      })
    },
  }),
)
