// lib/notification/notificationStore.ts

'use client'

import { create } from 'zustand'

export type NotificationType =
  | 'NOTICE'
  | 'BTC_ALERT'
  | 'INDICATOR'
  | 'INSTITUTIONAL_PATTERN'

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
  authenticated: boolean

  setServerSnapshot: (payload: {
    notifications: NotificationViewItem[]
    unreadCount: number
    isVIP: boolean
    authenticated?: boolean
  }) => void

  pushIncoming: (
    item: NotificationViewItem,
  ) => void

  loadUnreadCount: () => Promise<void>

  markOneRead: (
    id: string,
  ) => Promise<void>

  markAllRead: () => Promise<void>

  deleteOne: (
    id: string,
  ) => Promise<void>

  deleteAll: () => Promise<void>
}

function mergeNotifications(
  current: NotificationViewItem[],
  incoming: NotificationViewItem[],
) {
  const map = new Map<
    string,
    NotificationViewItem
  >()

  for (const item of current) {
    map.set(item.id, item)
  }

  for (const item of incoming) {
    map.set(item.id, item)
  }

  return Array.from(map.values()).sort(
    (a, b) =>
      b.createdAt - a.createdAt,
  )
}

async function safeFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
) {
  return fetch(input, {
    ...init,
    cache: 'no-store',
    credentials: 'include',
    headers: {
      ...(init?.headers || {}),
    },
  })
}

export const useNotificationStore =
  create<NotificationStore>(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      isVIP: false,
      initialized: false,
      authenticated: false,

      setServerSnapshot: ({
        notifications,
        unreadCount,
        isVIP,
        authenticated,
      }) => {
        const merged =
          mergeNotifications(
            get().notifications,
            notifications,
          )

        set({
          notifications: merged,
          unreadCount,
          isVIP,
          authenticated:
            authenticated ?? true,
          initialized: true,
        })
      },

      pushIncoming: item => {
        const {
          isVIP,
          notifications,
          unreadCount,
          authenticated,
        } = get()

        if (!authenticated) {
          return
        }

        /**
         * VIP gating 유지
         *
         * NOTICE 만 일반 사용자 허용
         * 나머지 alert 계열은 VIP 전용
         */
        if (
          !isVIP &&
          item.type !== 'NOTICE'
        ) {
          return
        }

        const existsById =
          notifications.some(
            n => n.id === item.id,
          )

        if (existsById) {
          return
        }

        const existsByContent =
          notifications.some(
            n =>
              n.type === item.type &&
              n.title === item.title &&
              n.createdAt ===
                item.createdAt,
          )

        if (existsByContent) {
          return
        }

        set({
          notifications: [
            item,
            ...notifications,
          ],

          unreadCount:
            unreadCount +
            (item.read ? 0 : 1),
        })
      },

      loadUnreadCount: async () => {
        try {
          const res =
            await safeFetch(
              '/api/notification?mode=badge',
            )

          if (!res.ok) {
            set({
              authenticated: false,
              unreadCount: 0,
              isVIP: false,
              initialized: true,
            })

            return
          }

          const data = await res.json()

          set({
            unreadCount:
              data.unreadCount ?? 0,

            isVIP:
              data.isVIP ?? false,

            authenticated:
              data.authenticated ??
              false,

            initialized: true,
          })
        } catch (error) {
          console.error(
            '[NOTIFICATION_LOAD_UNREAD]',
            error,
          )

          set({
            authenticated: false,
            unreadCount: 0,
            isVIP: false,
            initialized: true,
          })
        }
      },

      markOneRead: async id => {
        const { authenticated } =
          get()

        if (!authenticated) {
          return
        }

        const current =
          get().notifications

        const target = current.find(
          item => item.id === id,
        )

        if (
          !target ||
          target.read
        ) {
          return
        }

        const prevNotifications =
          current

        const prevUnreadCount =
          get().unreadCount

        set({
          notifications: current.map(
            item =>
              item.id === id
                ? {
                    ...item,
                    read: true,
                  }
                : item,
          ),

          unreadCount: Math.max(
            0,
            prevUnreadCount - 1,
          ),
        })

        const res = await safeFetch(
          '/api/notification/read',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              ids: [id],
            }),
          },
        )

        if (!res.ok) {
          set({
            notifications:
              prevNotifications,

            unreadCount:
              prevUnreadCount,
          })

          return
        }

        const data =
          await res.json()

        set({
          unreadCount:
            data.unreadCount ??
            get().unreadCount,
        })
      },

      // ✅ ALL READ SUPPORT
      // 기존 architecture 유지
      // notification structure 유지
      // unreadCount 즉시 0 반영
      // read=true optimistic update 적용
      markAllRead: async () => {
        const { authenticated } =
          get()

        if (!authenticated) {
          return
        }

        const current =
          get().notifications

        const prevNotifications =
          current

        const prevUnreadCount =
          get().unreadCount

        // ✅ optimistic update
        set({
          notifications: current.map(
            item => ({
              ...item,
              read: true,
            }),
          ),

          unreadCount: 0,
        })

        try {
          const unreadIds = current
            .filter(
              item => !item.read,
            )
            .map(item => item.id)

          // 이미 모두 읽음 상태면 API 호출 생략
          if (
            unreadIds.length === 0
          ) {
            return
          }

          const res =
            await safeFetch(
              '/api/notification/read',
              {
                method: 'POST',
                headers: {
                  'Content-Type':
                    'application/json',
                },
                body: JSON.stringify({
                  ids: unreadIds,
                }),
              },
            )

          if (!res.ok) {
            set({
              notifications:
                prevNotifications,

              unreadCount:
                prevUnreadCount,
            })

            return
          }

          const data =
            await res.json()

          set({
            unreadCount:
              data.unreadCount ??
              0,
          })
        } catch (error) {
          console.error(
            '[NOTIFICATION_MARK_ALL_READ]',
            error,
          )

          set({
            notifications:
              prevNotifications,

            unreadCount:
              prevUnreadCount,
          })
        }
      },

      deleteOne: async id => {
        const { authenticated } =
          get()

        if (!authenticated) {
          return
        }

        const current =
          get().notifications

        const target = current.find(
          item => item.id === id,
        )

        if (!target) {
          return
        }

        const prevNotifications =
          current

        const prevUnreadCount =
          get().unreadCount

        set({
          notifications:
            current.filter(
              item => item.id !== id,
            ),

          unreadCount: Math.max(
            0,
            prevUnreadCount -
              (target.read ? 0 : 1),
          ),
        })

        const res = await safeFetch(
          '/api/notification/delete',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({
              id,
            }),
          },
        )

        if (!res.ok) {
          set({
            notifications:
              prevNotifications,

            unreadCount:
              prevUnreadCount,
          })
        }
      },

      deleteAll: async () => {
        const { authenticated } =
          get()

        if (!authenticated) {
          return
        }

        const current =
          get().notifications

        const prevUnreadCount =
          get().unreadCount

        set({
          notifications: [],
          unreadCount: 0,
        })

        const res = await safeFetch(
          '/api/notification/delete-all',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
            },
            body: JSON.stringify({}),
          },
        )

        if (!res.ok) {
          set({
            notifications: current,
            unreadCount:
              prevUnreadCount,
          })
        }
      },
    }),
  )
  