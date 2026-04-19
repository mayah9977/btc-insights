// /lib/notification/notificationSettings.ts

export type NotificationImportance =
  | 'ALL'
  | 'CRITICAL_ONLY'

export type QuietHours = {
  from: number // 0 ~ 23
  to: number   // 0 ~ 23
}

export type IndicatorType = 'RSI' | 'MACD' | 'EMA'

export type NotificationSound =
  | 'default'
  | 'alert1'
  | 'alert2'
  | 'siren'

export type NotificationSettings = {
  sseEnabled: boolean
  pushEnabled: boolean
  importance: NotificationImportance
  quietHours?: QuietHours

  soundEnabled: boolean
  vibrationEnabled: boolean
  soundType: NotificationSound

  indicatorEnabled: Record<IndicatorType, boolean>
}

/** 기본값 */
export const defaultNotificationSettings: NotificationSettings = {
  sseEnabled: true,
  pushEnabled: true,
  importance: 'ALL',

  soundEnabled: true,
  vibrationEnabled: true,
  soundType: 'default',

  indicatorEnabled: {
    RSI: true,
    MACD: true,
    EMA: true,
  },
}
