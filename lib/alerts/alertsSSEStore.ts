// lib/alerts/alertsSSEStore.ts

'use client'

import { create } from 'zustand'
import { sseManager } from '@/lib/realtime/sseConnectionManager'
import { SSE_EVENT } from '@/lib/realtime/types'
import { getNotificationSettings } from '@/lib/notification/settingsClient'
import type {
  IndicatorTimeframe,
  IndicatorType,
} from '@/lib/notification/notificationSettings'
import { getUserVIP } from '@/lib/auth/getUserVIP'
import {
  renderAlertToast,
  renderIndicatorToast,
  renderInstitutionalPatternToast,
} from '@/app/[locale]/alerts/components/AlertToastRenderer'
import {
  useRealtimeInstitutionalPatternStore,
  type RealtimeInstitutionalPattern,
} from '@/lib/market/institutional/realtimeInstitutionalPatternStore'

export type SystemRiskLevel =
  | 'SAFE'
  | 'WARNING'
  | 'CRITICAL'

type AlertsSSEState = {
  connected: boolean
  systemRisk: SystemRiskLevel
  lastEventAt: number | null
  bootstrap: () => void
  shutdown: () => void
}

type AlertsSSEGlobalRuntime = {
  eventSource: EventSource | null
  unsubscribe: (() => void) | null
  watchdogTimer:
    | ReturnType<typeof setInterval>
    | null
  processedEventMap: Map<string, number>
  playedSoundMap: Map<string, number>
}

declare global {
  interface Window {
    __alertsSSEGlobalRuntime?:
      AlertsSSEGlobalRuntime
  }
}

/**
 * 🔒 Fast Refresh / StrictMode / HMR safe global runtime
 *
 * module-level singleton 은 runtime duplication 환경에서 깨질 수 있으므로
 * EventSource authority 와 dedupe maps 를 window global 로 승격합니다.
 */
const localRuntime: AlertsSSEGlobalRuntime = {
  eventSource: null,
  unsubscribe: null,
  watchdogTimer: null,
  processedEventMap: new Map<string, number>(),
  playedSoundMap: new Map<string, number>(),
}

function getAlertsSSEGlobalRuntime(): AlertsSSEGlobalRuntime {
  if (typeof window === 'undefined') {
    return localRuntime
  }

  if (!window.__alertsSSEGlobalRuntime) {
    window.__alertsSSEGlobalRuntime = {
      eventSource: null,
      unsubscribe: null,
      watchdogTimer: null,
      processedEventMap:
        new Map<string, number>(),
      playedSoundMap:
        new Map<string, number>(),
    }
  }

  return window.__alertsSSEGlobalRuntime
}

let soundInterval:
  | ReturnType<typeof setInterval>
  | null = null

let vibrationInterval:
  | ReturnType<typeof setInterval>
  | null = null

let audioInstance:
  | HTMLAudioElement
  | null = null

let notificationLoopToken = 0

let notificationLoopLock:
  | Promise<void>
  | null = null

let isNotificationLoopRunning = false

const CLIENT_DEDUPE_TTL_MS = 30_000

function cleanupTTLMap(
  map: Map<string, number>,
  ttlMs: number,
) {
  const now = Date.now()

  for (const [key, ts] of map.entries()) {
    if (now - ts > ttlMs) {
      map.delete(key)
    }
  }
}

function markIfDuplicate(
  map: Map<string, number>,
  key: string,
  ttlMs: number,
) {
  const now = Date.now()

  cleanupTTLMap(map, ttlMs)

  const existing = map.get(key)

  if (
    existing &&
    now - existing <= ttlMs
  ) {
    return true
  }

  map.set(key, now)

  return false
}

function normalizeIndicatorTimeframe(
  value: unknown,
): IndicatorTimeframe {
  return value === '1h' ? '1h' : '15m'
}

function normalizeIndicatorType(
  value: unknown,
): IndicatorType | null {
  if (
    value === 'RSI' ||
    value === 'MACD' ||
    value === 'EMA'
  ) {
    return value
  }

  return null
}

function normalizeInstitutionalPatternIntensity(
  value: unknown,
): RealtimeInstitutionalPattern['intensity'] {
  if (
    value === 'WEAK' ||
    value === 'BUILDING' ||
    value === 'AGGRESSIVE' ||
    value === 'EXTREME'
  ) {
    return value
  }

  return 'WEAK'
}

function normalizeInstitutionalPatternRisk(
  value: unknown,
): RealtimeInstitutionalPattern['risk'] {
  if (
    value === 'LOW' ||
    value === 'MEDIUM' ||
    value === 'HIGH'
  ) {
    return value
  }

  return 'LOW'
}

function buildAlertDedupeKey(
  data: any,
) {
  return `alert:${String(
    data?.alertId ?? '',
  )}`
}

function buildIndicatorDedupeKey(
  data: any,
) {
  const timeframe =
    normalizeIndicatorTimeframe(
      data?.timeframe,
    )

  const eventCandleTs = String(
    data?.eventCandleTs ??
      data?.ts ??
      '',
  )

  return `indicator:${String(
    data?.symbol ?? '',
  )}:${timeframe}:${String(
    data?.indicator ?? '',
  )}:${String(
    data?.signal ?? '',
  )}:${eventCandleTs}`
}

function buildInstitutionalPatternDedupeKey(
  data: any,
) {
  return `institutional:${String(
    data?.pattern ?? '',
  )}:${String(
    data?.confirmedCandleTs ?? '',
  )}`
}

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
    const audios =
      document.querySelectorAll('audio')

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

function getSoundFilePath(
  soundType: string,
) {
  const SOUND_MAP: Record<
    string,
    string
  > = {
    default: '/sounds/default.mp3',
    alert1: '/sounds/alert1.mp3',
    alert2: '/sounds/alert2.mp3',
    siren: '/sounds/siren.mp3',
  }

  return (
    SOUND_MAP[soundType] ??
    SOUND_MAP.default
  )
}

async function startNotificationLoop(
  lockKey?: string,
) {
  const runtime =
    getAlertsSSEGlobalRuntime()

  if (lockKey) {
    const duplicated =
      markIfDuplicate(
        runtime.playedSoundMap,
        lockKey,
        CLIENT_DEDUPE_TTL_MS,
      )

    if (duplicated) {
      return
    }
  }

  if (isNotificationLoopRunning) {
    return
  }

  if (notificationLoopLock) {
    await notificationLoopLock
  }

  let resolveLock!: () => void

  notificationLoopLock =
    new Promise<void>(resolve => {
      resolveLock = resolve
    })

  try {
    isNotificationLoopRunning = true

    const currentToken =
      ++notificationLoopToken

    stopNotificationLoop()

    const settings =
      await getNotificationSettings()

    if (
      currentToken !==
      notificationLoopToken - 1
    ) {
      return
    }

    if (settings.soundEnabled) {
      try {
        const audio = new Audio(
          getSoundFilePath(
            settings.soundType,
          ),
        )

        audio.loop = false
        audio.preload = 'auto'

        if (
          currentToken !==
          notificationLoopToken - 1
        ) {
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

        audio.onended = () => {
          if (audioInstance === audio) {
            audioInstance = null
          }

          isNotificationLoopRunning = false
        }
      } catch {
        audioInstance = null
      }
    }

    if (
      settings.vibrationEnabled &&
      'vibrate' in navigator
    ) {
      if (
        currentToken !==
        notificationLoopToken - 1
      ) {
        return
      }

      navigator.vibrate?.([
        180,
        80,
        120,
      ])
    }
  } finally {
    notificationLoopLock = null

    resolveLock()

    if (!audioInstance) {
      isNotificationLoopRunning = false
    }
  }
}

export const useAlertsSSEStore =
  create<AlertsSSEState>(
    (set, get) => ({
      connected: false,
      systemRisk: 'SAFE',
      lastEventAt: null,

      bootstrap: () => {
        if (
          typeof window ===
          'undefined'
        ) {
          return
        }

        const runtime =
          getAlertsSSEGlobalRuntime()

        /**
         * 🔒 Global EventSource singleton guard
         *
         * Fast Refresh / StrictMode 에서 module instance 가 복제되어도
         * 기존 EventSource 가 살아 있으면 새 연결을 만들지 않습니다.
         */
        if (
          runtime.unsubscribe ||
          runtime.eventSource
        ) {
          console.log(
            '[alerts-sse] global singleton already active',
          )

          set({
            connected: true,
            systemRisk: 'SAFE',
            lastEventAt:
              Date.now(),
          })

          return
        }

        console.log(
          '[alerts-sse] bootstrap (manager)',
        )

        console.log(
          '[alerts-sse] manager-ready:',
          !!sseManager,
        )

        console.log(
          '[alerts-sse] SSE_EVENT ready:',
          !!SSE_EVENT,
        )

        let connectTimer:
          | ReturnType<typeof setTimeout>
          | null = null

        let activeEventSource:
          | EventSource
          | null = null

        runtime.unsubscribe = () => {
          if (connectTimer) {
            clearTimeout(connectTimer)
            connectTimer = null
          }

          if (activeEventSource) {
            activeEventSource.close()
          }

          if (
            runtime.eventSource ===
            activeEventSource
          ) {
            runtime.eventSource = null
          }

          activeEventSource = null
        }

        const connectAlertsSSE = () => {
          const es = new EventSource(
            '/api/alerts/sse',
          )

          activeEventSource = es
          runtime.eventSource = es

          es.onopen = () => {
            console.log(
              '[alerts-sse] connected: /api/alerts/sse',
            )

            set({
              connected: true,
              systemRisk: 'SAFE',
              lastEventAt: Date.now(),
            })
          }

          es.onmessage = async event => {
            let data: any

            try {
              data = JSON.parse(
                event.data,
              )
            } catch (error) {
              console.error(
                '[alerts-sse] parse error:',
                error,
              )

              return
            }

            console.log(
              'SSE RAW DATA:',
              data,
            )

            set({
              connected: true,
              systemRisk: 'SAFE',
              lastEventAt: Date.now(),
            })

            if (
              data?.type ===
              'ALERT_TRIGGERED'
            ) {
              const dedupeKey =
                buildAlertDedupeKey(
                  data,
                )

              if (
                markIfDuplicate(
                  runtime.processedEventMap,
                  dedupeKey,
                  CLIENT_DEDUPE_TTL_MS,
                )
              ) {
                console.log(
                  '[alerts-sse] duplicate alert ignored:',
                  dedupeKey,
                )

                return
              }

              const payload = {
                type: 'ALERT_TRIGGERED',
                alertId:
                  data.alertId,
                symbol:
                  data.symbol,
                price: data.price,
                ts:
                  data.ts ??
                  Date.now(),
              }

              console.log(
                'SSE PAYLOAD:',
                payload,
              )

              renderAlertToast({
                symbol:
                  payload.symbol,
                price:
                  payload.price,
              })

              void fetch(
                '/api/notification/save',
                {
                  method: 'POST',
                  headers: {
                    'Content-Type':
                      'application/json',
                  },
                  body: JSON.stringify(
                    {
                      id: String(
                        payload.alertId,
                      ),

                      type: 'BTC_ALERT',

                      title: `${payload.symbol} price notification`,

                      body: `Price ${payload.price} reached`,

                      createdAt:
                        payload.ts,
                    },
                  ),
                },
              )

              void startNotificationLoop(
                dedupeKey,
              )

              window.dispatchEvent(
                new CustomEvent(
                  'alerts:sse',
                  {
                    detail:
                      payload,
                  },
                ),
              )

              window.dispatchEvent(
                new CustomEvent(
                  'alert:triggered',
                  {
                    detail:
                      payload,
                  },
                ),
              )
            }

            if (
              data?.type ===
              'INDICATOR_SIGNAL'
            ) {
              const dedupeKey =
                buildIndicatorDedupeKey(
                  data,
                )

              if (
                markIfDuplicate(
                  runtime.processedEventMap,
                  dedupeKey,
                  CLIENT_DEDUPE_TTL_MS,
                )
              ) {
                console.log(
                  '[alerts-sse] duplicate indicator ignored:',
                  dedupeKey,
                )

                return
              }

              console.log(
                'INDICATOR SIGNAL:',
                data,
              )

              const isVIP =
                await getUserVIP()

              if (!isVIP) {
                return
              }

              const settings =
                await getNotificationSettings()

              const indicator =
                normalizeIndicatorType(
                  data.indicator,
                )

              if (!indicator) {
                console.log(
                  '[alerts-sse] invalid indicator ignored:',
                  data.indicator,
                )

                return
              }

              const timeframe =
                normalizeIndicatorTimeframe(
                  data.timeframe,
                )

              if (
                settings.indicatorEnabled?.[
                  indicator
                ]?.[timeframe] === false
              ) {
                console.log(
                  '[alerts-sse] indicator disabled by timeframe settings:',
                  {
                    indicator,
                    timeframe,
                  },
                )

                return
              }

              const eventCandleTs =
                Number(
                  data.eventCandleTs ??
                    data.ts ??
                    Date.now(),
                )

              const SIGNAL_MAP: Record<
                IndicatorType,
                Record<
                  string,
                  string
                >
              > = {
                RSI: {
                  RSI_OVERBOUGHT:
                    timeframe === '1h'
                      ? 'RSI 과매수 진입'
                      : 'RSI 과매수 진입',

                  RSI_OVERSOLD:
                    timeframe === '1h'
                      ? 'RSI 과매도 진입'
                      : 'RSI 과매도 진입',
                },

                MACD: {
                  GOLDEN_CROSS:
                    timeframe === '1h'
                      ? 'MACD 골든크로스'
                      : 'MACD 골든크로스',

                  DEAD_CROSS:
                    timeframe === '1h'
                      ? 'MACD 데드크로스'
                      : 'MACD 데드크로스',
                },

                EMA: {
                  BULLISH_TREND:
                    timeframe === '1h'
                      ? 'EMA 상방 추세 전환'
                      : 'EMA 상방 추세 전환',

                  BEARISH_TREND:
                    timeframe === '1h'
                      ? 'EMA 하방 추세 전환'
                      : 'EMA 하방 추세 전환',
                },
              }

              const label =
                SIGNAL_MAP[
                  indicator
                ]?.[
                  String(
                    data.signal ?? '',
                  )
                ] ??
                `${indicator} ${String(
                  data.signal ?? '',
                )}`

              const payload = {
                type: 'INDICATOR_SIGNAL',
                symbol: String(
                  data.symbol ?? '',
                ),
                indicator,
                signal: String(
                  data.signal ?? '',
                ),
                timeframe,
                value: Number(
                  data.value,
                ),
                ts:
                  data.ts ??
                  Date.now(),
                eventCandleTs,
              }

              renderIndicatorToast({
                symbol:
                  payload.symbol,

                indicator:
                  payload.indicator,

                label,

                signal:
                  payload.signal,

                value:
                  payload.value,

                timeframe:
                  payload.timeframe,
              })

              void fetch(
                '/api/notification/save',
                {
                  method: 'POST',
                  headers: {
                    'Content-Type':
                      'application/json',
                  },

                  body: JSON.stringify(
                    {
                      id: dedupeKey,

                      type: 'INDICATOR',

                      title: `${payload.timeframe.toUpperCase()} ${payload.indicator} signal`,

                      body: label,

                      createdAt:
                        payload.ts,
                    },
                  ),
                },
              )

              void startNotificationLoop(
                dedupeKey,
              )

              window.dispatchEvent(
                new CustomEvent(
                  'alerts:sse',
                  {
                    detail:
                      payload,
                  },
                ),
              )

              window.dispatchEvent(
                new CustomEvent(
                  'indicator:triggered',
                  {
                    detail:
                      payload,
                  },
                ),
              )
            }

            if (
              data?.type ===
              'INSTITUTIONAL_PATTERN_SIGNAL'
            ) {
              console.log(
                '[INSTITUTIONAL_PATTERN_REALTIME_HANDLER_START]',
                {
                  ts: Date.now(),
                  data,
                },
              )

              const dedupeKey =
                buildInstitutionalPatternDedupeKey(
                  data,
                )

              console.log(
                '[INSTITUTIONAL_PATTERN_REALTIME_DEDUPE_CHECK]',
                {
                  ts: Date.now(),
                  dedupeKey,
                  processedKeys:
                    Array.from(
                      runtime.processedEventMap.keys(),
                    ),
                },
              )

              if (
                markIfDuplicate(
                  runtime.processedEventMap,
                  dedupeKey,
                  CLIENT_DEDUPE_TTL_MS,
                )
              ) {
                console.log(
                  '[alerts-sse] duplicate institutional pattern ignored:',
                  dedupeKey,
                )

                console.log(
                  '[INSTITUTIONAL_PATTERN_REALTIME_ABORTED]',
                  {
                    ts: Date.now(),
                    dedupeKey,
                    reason: 'CLIENT_DEDUPE',
                  },
                )

                return
              }

              console.log(
                'INSTITUTIONAL PATTERN SIGNAL:',
                data,
              )

              const isVIP =
                await getUserVIP()

              console.log(
                '[INSTITUTIONAL_PATTERN_REALTIME_VIP_CHECK]',
                {
                  ts: Date.now(),
                  dedupeKey,
                  isVIP,
                },
              )

              if (!isVIP) {
                console.log(
                  '[INSTITUTIONAL_PATTERN_REALTIME_ABORTED]',
                  {
                    ts: Date.now(),
                    dedupeKey,
                    reason: 'VIP_FALSE',
                  },
                )

                return
              }

              const settings =
                await getNotificationSettings()

              console.log(
                '[INSTITUTIONAL_PATTERN_REALTIME_SETTING_CHECK]',
                {
                  ts: Date.now(),
                  dedupeKey,
                  institutionalPatternEnabled:
                    settings.institutionalPatternEnabled,
                  soundEnabled:
                    settings.soundEnabled,
                  vibrationEnabled:
                    settings.vibrationEnabled,
                  soundType:
                    settings.soundType,
                  documentHidden:
                    typeof document !== 'undefined'
                      ? document.hidden
                      : null,
                  notificationPermission:
                    typeof Notification !== 'undefined'
                      ? Notification.permission
                      : null,
                },
              )

              /**
               * institutional realtime alert runtime gating
               */
              if (
                settings.institutionalPatternEnabled ===
                false
              ) {
                console.log(
                  '[alerts-sse] institutional pattern disabled by settings',
                )

                console.log(
                  '[INSTITUTIONAL_PATTERN_REALTIME_ABORTED]',
                  {
                    ts: Date.now(),
                    dedupeKey,
                    reason: 'SETTING_DISABLED',
                  },
                )

                return
              }

              const payload = {
                type: 'INSTITUTIONAL_PATTERN_SIGNAL',

                pattern: String(
                  data.pattern ?? '',
                ),

                intensity: String(
                  data.intensity ??
                    '',
                ),

                risk: String(
                  data.risk ?? '',
                ),

                summary: String(
                  data.summary ??
                    '',
                ),

                confirmedCandleTs:
                  Number(
                    data.confirmedCandleTs,
                  ),

                ts:
                  data.ts ??
                  Date.now(),
              }

              useRealtimeInstitutionalPatternStore
                .getState()
                .setPattern({
                  type: payload.pattern,

                  pattern:
                    payload.pattern,

                  title:
                    payload.pattern,

                  summary:
                    payload.summary,

                  intensity:
                    normalizeInstitutionalPatternIntensity(
                      payload.intensity,
                    ),

                  risk:
                    normalizeInstitutionalPatternRisk(
                      payload.risk,
                    ),

                  confirmedCandleTs:
                    payload.confirmedCandleTs,

                  ts:
                    payload.ts,
                })

              console.log(
                '[REALTIME_INSTITUTIONAL_PATTERN_STORE_SET]',
                {
                  pattern:
                    payload.pattern,
                  intensity:
                    payload.intensity,
                  risk:
                    payload.risk,
                  confirmedCandleTs:
                    payload.confirmedCandleTs,
                  ts:
                    payload.ts,
                },
              )

              console.log(
                '[INSTITUTIONAL_PATTERN_REALTIME_TOAST_ATTEMPT]',
                {
                  ts: Date.now(),
                  dedupeKey,
                  payload,
                },
              )

              renderInstitutionalPatternToast(
                {
                  pattern:
                    payload.pattern,

                  intensity:
                    payload.intensity,

                  risk:
                    payload.risk,

                  summary:
                    payload.summary,
                },
              )

              console.log(
                '[INSTITUTIONAL_PATTERN_REALTIME_TOAST_RENDERED]',
                {
                  ts: Date.now(),
                  dedupeKey,
                },
              )

              void startNotificationLoop(
                dedupeKey,
              )

              console.log(
                '[INSTITUTIONAL_PATTERN_REALTIME_SOUND_REQUESTED]',
                {
                  ts: Date.now(),
                  dedupeKey,
                },
              )

              window.dispatchEvent(
                new CustomEvent(
                  'alerts:sse',
                  {
                    detail:
                      payload,
                  },
                ),
              )

              // MODIFIED: Institutional notification history ingestion event.
              window.dispatchEvent(
                new CustomEvent(
                  'institutional-pattern:triggered',
                  {
                    detail:
                      payload,
                  },
                ),
              )

              console.log(
                '[INSTITUTIONAL_PATTERN_REALTIME_DISPATCHED]',
                {
                  ts: Date.now(),
                  dedupeKey,
                  payload,
                },
              )
            }
          }

          es.onerror = error => {
            console.warn(
              '[alerts-sse] connection error:',
              error,
            )

            set({
              connected: false,
              systemRisk: 'CRITICAL',
            })
          }

          runtime.unsubscribe = () => {
            if (connectTimer) {
              clearTimeout(connectTimer)
              connectTimer = null
            }

            es.close()

            if (
              runtime.eventSource === es
            ) {
              runtime.eventSource = null
            }

            activeEventSource = null
          }
        }

        connectTimer = setTimeout(() => {
          connectAlertsSSE()
        }, 1500)

        runtime.watchdogTimer =
          setInterval(() => {
            const last =
              get().lastEventAt

            if (!last) {
              return
            }

            const gap =
              Date.now() - last

            if (gap > 10_000) {
              set({
                connected: false,
                systemRisk:
                  'CRITICAL',
              })
            } else if (
              gap > 5_000
            ) {
              set({
                connected: true,
                systemRisk:
                  'WARNING',
              })
            }
          }, 5_000)
      },

      shutdown: () => {
        const runtime =
          getAlertsSSEGlobalRuntime()

        if (runtime.unsubscribe) {
          runtime.unsubscribe()
          runtime.unsubscribe = null
        }

        if (runtime.watchdogTimer) {
          clearInterval(
            runtime.watchdogTimer,
          )

          runtime.watchdogTimer = null
        }

        runtime.eventSource = null

        runtime.processedEventMap.clear()

        runtime.playedSoundMap.clear()

        stopNotificationLoop()

        set({
          connected: false,
          systemRisk: 'SAFE',
          lastEventAt: null,
        })
      },
    }),
  )
  