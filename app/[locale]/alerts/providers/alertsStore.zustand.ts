'use client'

import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import type { PriceAlert } from '@/lib/alerts/alertStore.client'
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
   * Settings (UI filter)
   * ========================= */
  notificationSettings?: NotificationSettings
  setNotificationSettings: (s: NotificationSettings) => void

  /* =========================
   * Derived helpers
   * ========================= */
  getAll: () => PriceAlert[]
  getWaiting: () => PriceAlert[]
  getCooldown: () => PriceAlert[]
  getDisabled: () => PriceAlert[]

  /* =========================
   * Actions
   * ========================= */
  bootstrap: () => Promise<void>
  upsertAlert: (alert: PriceAlert) => void
  removeAlert: (id: string) => void
  markTriggered: (payload: RealtimeEvent) => void
}

/* =========================
 * 🔒 SSE listener singleton
 * ========================= */
let sseBound = false

/* =========================
 * Store
 * ========================= */

export const useAlertsStore = create<AlertsState>()(
  subscribeWithSelector((set, get) => {
    /* =========================
     * SSE → UI Event Listener (ONCE)
     * ========================= */
    if (typeof window !== 'undefined' && !sseBound) {
      sseBound = true

      window.addEventListener('alerts:sse', (e: any) => {
        const settings = get().notificationSettings

        // 🔕 UI-level SSE filter
        if (settings && settings.sseEnabled === false) return

        const data = e.detail
        if (data?.type === 'ALERT_TRIGGERED') {
          get().markTriggered(data)
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
      setNotificationSettings: (s) =>
        set({ notificationSettings: s }),

      /* =========================
       * Selectors
       * ========================= */
      getAll: () =>
        get()
          .orderedIds
          .map(id => get().alertsById[id])
          .filter(Boolean),

      getWaiting: () =>
        get()
          .getAll()
          .filter(
            a =>
              a.enabled &&
              (!a.lastTriggeredAt ||
                (a.cooldownMs &&
                  Date.now() - a.lastTriggeredAt >= a.cooldownMs)),
          ),

      getCooldown: () =>
        get()
          .getAll()
          .filter(
            a =>
              a.enabled &&
              a.lastTriggeredAt &&
              a.cooldownMs &&
              Date.now() - a.lastTriggeredAt < a.cooldownMs,
          ),

      getDisabled: () =>
        get()
          .getAll()
          .filter(a => !a.enabled),

      /* =========================
       * Bootstrap (initial load)
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
       * Realtime Trigger
       * ========================= */
      markTriggered: ({ alertId, symbol, price, ts }) =>
        set(state => {
          const alert = state.alertsById[alertId]
          if (!alert) return state

          // 🔔 UI effect (toast / sound)
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
                triggered:
                  alert.repeatMode === 'ONCE'
                    ? true
                    : alert.triggered,
                lastTriggeredAt: ts,
              },
            },
          }
        }),
    }
  }),
)
