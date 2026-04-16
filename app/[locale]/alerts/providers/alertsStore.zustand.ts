// /app/[locale]/alerts/providers/alertsStore.zustand.ts
'use client'

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { PriceAlert } from '@/lib/alerts/alertStore.types'
import type { NotificationSettings } from '@/lib/notification/notificationSettings'

export type RealtimeEvent = {
  type: 'ALERT_TRIGGERED'
  alertId: string
  symbol: string
  price: number
  ts: number
}

export type IndicatorEvent = {
  type: 'INDICATOR_SIGNAL'
  indicator: string
  signal: string
  symbol: string
  timeframe: string
  value: number
  ts: number
}

type AlertsState = {
  alertsById: Record<string, PriceAlert>
  orderedIds: string[]
  indicatorSignals: IndicatorEvent[]

  indicatorEnabled: {
    RSI: boolean
    MACD: boolean
    EMA: boolean
  }
  setIndicatorEnabled: (v: {
    RSI: boolean
    MACD: boolean
    EMA: boolean
  }) => void

  notificationSettings?: NotificationSettings
  setNotificationSettings: (s: NotificationSettings) => void

  getAll: () => PriceAlert[]

  bootstrap: () => Promise<void>
  addAlert: (alert: PriceAlert) => void
  upsertAlert: (alert: PriceAlert) => void
  removeAlert: (id: string) => void

  applyTriggered: (payload: RealtimeEvent) => void
}

let sseBound = false

export const useAlertsStore = create<AlertsState>()(
  subscribeWithSelector((set, get) => {
    if (typeof window !== 'undefined' && !sseBound) {
      sseBound = true

      window.addEventListener('alerts:sse', (e: any) => {
        const settings = get().notificationSettings
        if (settings?.sseEnabled === false) return

        const data = e.detail

        if (data?.type === 'ALERT_TRIGGERED') {
          get().applyTriggered(data)
        }

        if (data?.type === 'INDICATOR_SIGNAL') {
          set(state => ({
            indicatorSignals: [data, ...state.indicatorSignals].slice(0, 50),
          }))

          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('indicator:triggered', {
                detail: data,
              }),
            )
          }
        }
      })
    }

    return {
      alertsById: {},
      orderedIds: [],
      indicatorSignals: [],
      indicatorEnabled: {
        RSI: true,
        MACD: true,
        EMA: true,
      },

      setIndicatorEnabled: v => set({ indicatorEnabled: v }),

      notificationSettings: undefined,

      setNotificationSettings: s =>
        set({ notificationSettings: s }),

      getAll: () =>
        get()
          .orderedIds
          .map(id => get().alertsById[id])
          .filter(Boolean),

      bootstrap: async () => {
        try {
          const resSettings = await fetch('/api/alerts/indicator-settings', {
            cache: 'no-store',
          })
          const jsonSettings = await resSettings.json()
          if (jsonSettings?.data) {
            set({ indicatorEnabled: jsonSettings.data })
          }
        } catch {}

        const res = await fetch('/api/alerts', { cache: 'no-store' })
        const json = await res.json()
        if (!Array.isArray(json?.alerts)) return

        set(() => {
          const byId: Record<string, PriceAlert> = {}
          const ids: string[] = []

          for (const alert of json.alerts) {
            byId[alert.id] = alert
            ids.push(alert.id)
          }

          return {
            alertsById: byId,
            orderedIds: ids.sort(
              (a, b) => byId[b].createdAt - byId[a].createdAt,
            ),
          }
        })
      },

      addAlert: alert =>
        set(state => ({
          alertsById: {
            ...state.alertsById,
            [alert.id]: alert,
          },
          orderedIds: [alert.id, ...state.orderedIds],
        })),

      upsertAlert: alert =>
        set(state => {
          const exists = !!state.alertsById[alert.id]
          return {
            alertsById: {
              ...state.alertsById,
              [alert.id]: alert,
            },
            orderedIds: exists
              ? state.orderedIds
              : [alert.id, ...state.orderedIds],
          }
        }),

      removeAlert: id =>
        set(state => {
          const next = { ...state.alertsById }
          delete next[id]
          return {
            alertsById: next,
            orderedIds: state.orderedIds.filter(x => x !== id),
          }
        }),

      applyTriggered: ({ alertId, symbol, price, ts }) =>
        set(state => {
          const alert = state.alertsById[alertId]
          if (!alert) return state

          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('alert:triggered', {
                detail: { id: alertId, symbol, price },
              }),
            )
          }

          return {
            alertsById: {
              ...state.alertsById,
              [alertId]: {
                ...alert,
                status:
                  alert.repeatMode === 'ONCE'
                    ? 'TRIGGERED'
                    : 'WAITING',
                lastTriggeredAt: ts,
              },
            },
          }
        }),
    }
  }),
)
