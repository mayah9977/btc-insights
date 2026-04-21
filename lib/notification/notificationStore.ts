'use client'

import { create } from 'zustand'

export type NotificationType = 'NOTICE' | 'BTC_ALERT' | 'INDICATOR'

export type NotificationViewItem = {
  id: string
  type: NotificationType
  title: string
  body: string
  createdAt: number
  read: boolean
}

type NotificationStore = {
  notifications: NotificationViewItem[]
  unreadCount: number
  isVIP: boolean
  initialized: boolean

  setServerSnapshot: (payload: {
    notifications: NotificationViewItem[]
    unreadCount: number
    isVIP: boolean
  }) => void

  pushIncoming: (item: NotificationViewItem) => void
  loadUnreadCount: () => Promise<void>
  markOneRead: (id: string) => Promise<void>
  markAllRead: () => Promise<void>
}

function mergeNotifications(
  current: NotificationViewItem[],
  incoming: NotificationViewItem[],
) {
  const map = new Map<string, NotificationViewItem>()

  for (const item of current) {
    map.set(item.id, item)
  }

  for (const item of incoming) {
    map.set(item.id, item)
  }

  return Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt)
}

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isVIP: false,
  initialized: false,

  setServerSnapshot: ({ notifications, unreadCount, isVIP }) => {
    const merged = mergeNotifications(get().notifications, notifications)

    set({
      notifications: merged,
      unreadCount,
      isVIP,
      initialized: true,
    })
  },

  pushIncoming: (item) => {
    const { isVIP, notifications, unreadCount } = get()

    if (!isVIP && item.type !== 'NOTICE') {
      return
    }

    // 🔥 핵심: ID 기반 dedupe (절대 필수)
    const exists = notifications.some(n => n.id === item.id)
    if (exists) {
      return
    }

    set({
      notifications: [item, ...notifications], // prepend 유지
      unreadCount: unreadCount + (item.read ? 0 : 1),
    })
  },

  loadUnreadCount: async () => {
    const res = await fetch('/api/notification?mode=badge', {
      cache: 'no-store',
    })

    if (!res.ok) {
      return
    }

    const data = await res.json()

    set({
      unreadCount: data.unreadCount ?? 0,
      isVIP: data.isVIP ?? false,
      initialized: true,
    })
  },

  markOneRead: async (id: string) => {
    const current = get().notifications
    const target = current.find(item => item.id === id)

    if (!target || target.read) {
      return
    }

    set({
      notifications: current.map(item =>
        item.id === id ? { ...item, read: true } : item,
      ),
      unreadCount: Math.max(0, get().unreadCount - 1),
    })

    const res = await fetch('/api/notification/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    })

    if (!res.ok) {
      return
    }

    const data = await res.json()

    set({
      unreadCount: data.unreadCount ?? get().unreadCount,
    })
  },

  markAllRead: async () => {
    const current = get().notifications

    set({
      notifications: current.map(item => ({
        ...item,
        read: true,
      })),
      unreadCount: 0,
    })

    const res = await fetch('/api/notification/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    if (!res.ok) {
      return
    }

    const data = await res.json()

    set({
      unreadCount: data.unreadCount ?? 0,
    })
  },
}))
