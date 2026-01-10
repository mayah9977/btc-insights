'use client'

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { PriceAlert } from '@/lib/alerts/alertStore.types'
import type { NotificationSettings } from '@/lib/notification/notificationSettings'

/* =========================
 * Types
 * ========================= */

export type RealtimeEvent = {
  type: 'ALERT_TRIGGERED'
  alertId: string
  symbol: string
  price: number
  ts: number
}

type AlertsState = {
  /* =========================
   * Data
   * ========================= */
  alertsById: Record<string, PriceAlert>
  orderedIds: string[]

  /* =========================
   * Settings
   * ========================= */
  notificationSettings?: NotificationSettings
  setNotificationSettings: (s: NotificationSettings) => void

  /* =========================
   * Selectors (RAW ONLY)
   * ========================= */
  getAll: () => PriceAlert[]

  /* =========================
   * Actions
   * ========================= */
  bootstrap: () => Promise<void>
  addAlert: (alert: PriceAlert) => void
  upsertAlert: (alert: PriceAlert) => void
  removeAlert: (id: string) => void

  /** 🔥 SSE 반영 (status 기반) */
  applyTriggered: (payload: RealtimeEvent) => void
}

/* =========================
 * SSE listener singleton
 * ========================= */

let sseBound = false

/* =========================
 * Store
 * ========================= */

export const useAlertsStore = create<AlertsState>()(
  subscribeWithSelector((set, get) => {
    /* =========================
     * SSE → Store 연결 (ONCE)
     * ========================= */
    if (typeof window !== 'undefined' && !sseBound) {
      sseBound = true

      window.addEventListener('alerts:sse', (e: any) => {
        const settings = get().notificationSettings
        if (settings?.sseEnabled === false) return

        const data = e.detail
        if (data?.type === 'ALERT_TRIGGERED') {
          get().applyTriggered(data)
        }
      })
    }

    return {
      alertsById: {},
      orderedIds: [],
      notificationSettings: undefined,

      /* =========================
       * Settings
       * ========================= */
      setNotificationSettings: s =>
        set({ notificationSettings: s }),

      /* =========================
       * Selectors
       * ========================= */
      getAll: () =>
        get()
          .orderedIds
          .map(id => get().alertsById[id])
          .filter(Boolean),

      /* =========================
       * Bootstrap
       * ========================= */
      bootstrap: async () => {
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

      /* =========================
       * CRUD
       * ========================= */
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

      /* =========================
       * 🔥 Realtime Trigger (SSOT)
       * ========================= */
      applyTriggered: ({ alertId, symbol, price, ts }) =>
        set(state => {
          const alert = state.alertsById[alertId]
          if (!alert) return state

          // UI 이벤트 (toast 등)
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
