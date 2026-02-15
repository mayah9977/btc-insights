'use client'

import { create } from 'zustand'
import type { NotificationItem } from './notificationTypes'

type NotificationState = {
  history: NotificationItem[]
  record: (item: NotificationItem) => void
  clear: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  history: [],

  record: (item) =>
    set((state) => {
      const last = state.history[0]

      // 동일 알림 중복 방지
      if (
        last &&
        last.level === item.level &&
        last.message === item.message &&
        last.at === item.at
      ) {
        return state
      }

      return {
        history: [item, ...state.history].slice(0, 200),
      }
    }),

  clear: () => set({ history: [] }),
}))

/* ===============================
   🔄 Backward Compatibility Layer
================================ */

/** 기존 코드 호환용 */
export const recordNotification = (item: NotificationItem) =>
  useNotificationStore.getState().record(item)

/** 기존 getNotificationHistory 복구 */
export const getNotificationHistory = () =>
  useNotificationStore.getState().history

/** 🔥 타입 완전 안전 Stats 계산 */
export const getNotificationStats = () => {
  const history = useNotificationStore.getState().history

  const stats = history.reduce(
    (acc, item) => {
      acc.total++

      const levelKey = String(item.level).toLowerCase()

      if (levelKey in acc) {
        ;(acc as any)[levelKey]++
      }

      return acc
    },
    {
      total: 0,
      high: 0,
      medium: 0,
      low: 0,
    }
  )

  return stats
}
