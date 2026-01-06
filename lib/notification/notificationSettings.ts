export type NotificationImportance =
  | 'ALL'
  | 'CRITICAL_ONLY'

export type QuietHours = {
  from: number // 0 ~ 23
  to: number   // 0 ~ 23
}

export type NotificationSettings = {
  sseEnabled: boolean
  pushEnabled: boolean
  importance: NotificationImportance
  quietHours?: QuietHours
}

/** 기본값 */
export const defaultNotificationSettings: NotificationSettings = {
  sseEnabled: true,
  pushEnabled: true,
  importance: 'ALL',
}
