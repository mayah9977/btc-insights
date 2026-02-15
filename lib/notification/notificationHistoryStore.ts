'use client'

import { create } from 'zustand'
import type { NotificationItem } from './notificationTypes'

type NotificationState = {
  history: NotificationItem[]
  record: (item: NotificationItem) => void
  clear: () => void
}

/**
 * 🔔 Notification SSOT
 * - 중복 알림 자동 차단
 */
export const useNotificationStore = create<NotificationState>((set, get) => ({
  history: [],

  record: (item) =>
    set((state) => {
      const last = state.history[0]

      // ✅ 동일 알림 중복 차단
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

/**
 * 🔄 기존 코드 호환용 (유지)
 */
export const recordNotification = (item: NotificationItem) =>
  useNotificationStore.getState().record(item)
