import { defaultNotificationSettings } from './notificationSettings'

const store = new Map<string, any>()

export async function getUserNotificationSettings(userId: string) {
  return store.get(userId) ?? defaultNotificationSettings
}

export async function saveUserNotificationSettings(
  userId: string,
  settings: any,
) {
  store.set(userId, settings)
}
