'use client'

import { create } from 'zustand'
import type { NotificationItem } from './notificationTypes'

type NotificationState = {
  history: NotificationItem[]
  record: (item: NotificationItem) => void
  clear: () => void
}

/**
 * 🔔 Notification SSOT (Disabled Safe Mode)
 */
export const useNotificationStore = create<NotificationState>(() => ({
  history: [],
  record: () => {}, // 🔕 비활성화
  clear: () => {},
}))

/**
 * 🔄 기존 코드 호환용
 */
export const recordNotification = (_item: NotificationItem) => {}

/**
 * ✅ 빌드 에러 해결용 더미 export
 * 기존 getNotificationHistory import 유지
 */
export const getNotificationHistory = (): NotificationItem[] => {
  return []
}
