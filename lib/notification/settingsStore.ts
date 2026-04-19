// /lib/notification/settingsStore.ts

import { defaultNotificationSettings, type NotificationSettings } from './notificationSettings'

const store = new Map<string, NotificationSettings>()

export async function getUserNotificationSettings(userId: string): Promise<NotificationSettings> {
  return store.get(userId) ?? defaultNotificationSettings
}

export async function saveUserNotificationSettings(
  userId: string,
  settings: NotificationSettings,
) {
  store.set(userId, settings)
}
