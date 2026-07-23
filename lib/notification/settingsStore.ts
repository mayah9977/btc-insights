// lib/notification/settingsStore.ts

import 'server-only'

export {
  getUserNotificationSettings,
  saveUserNotificationSettings,
  setUserNotificationSettings,
} from './settingsStore.server'

export type {
  NotificationSettingsPatch,
} from './settingsStore.server'
