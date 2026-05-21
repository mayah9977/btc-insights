// lib/notification/settingsStore.ts

import {
  defaultNotificationSettings,
  normalizeNotificationSettings,
  type NotificationSettings,
} from './notificationSettings'

const store = new Map<
  string,
  NotificationSettings
>()

function withDefaults(
  settings?: Partial<NotificationSettings>,
): NotificationSettings {
  return normalizeNotificationSettings(
    settings ?? defaultNotificationSettings,
  )
}

export async function getUserNotificationSettings(
  userId: string,
): Promise<NotificationSettings> {
  const existing = store.get(userId)

  if (!existing) {
    const fallback = withDefaults()

    store.set(userId, fallback)

    return fallback
  }

  const normalized = withDefaults(existing)

  /**
   * Migration-safe writeback.
   *
   * 기존 runtime store 에 legacy boolean indicatorEnabled 가 남아있어도
   * 다음 접근부터 timeframe-aware schema 로 고정합니다.
   */
  store.set(userId, normalized)

  return normalized
}

export async function saveUserNotificationSettings(
  userId: string,
  settings: NotificationSettings,
) {
  store.set(
    userId,
    withDefaults(settings),
  )
}
