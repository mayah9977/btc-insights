// lib/notification/settingsClient.ts

'use client'

import type {
  NotificationSettings,
  QuietHours,
} from './notificationSettings'

export type { NotificationSettings } from './notificationSettings'

type IndicatorEnabledPatch = Partial<{
  [Indicator in keyof NotificationSettings['indicatorEnabled']]:
    | boolean
    | Partial<
        NotificationSettings['indicatorEnabled'][Indicator]
      >
}>

export type NotificationSettingsPatch = Omit<
  Partial<NotificationSettings>,
  'indicatorEnabled' | 'quietHours'
> & {
  quietHours?: QuietHours | null
  indicatorEnabled?: IndicatorEnabledPatch
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const res = await fetch('/api/settings/notifications', {
    method: 'GET',
    cache: 'no-store',
    headers: {
      'Cache-Control': 'no-cache',
    },
  })

  if (!res.ok) {
    throw new Error('Failed to fetch notification settings')
  }

  return res.json()
}

export async function saveNotificationSettings(
  settings: NotificationSettingsPatch,
) {
  const hasQuietHours =
    Object.prototype.hasOwnProperty.call(
      settings,
      'quietHours',
    )

  const payload = {
    ...settings,
    ...(hasQuietHours
      ? {
          quietHours:
            settings.quietHours ?? null,
        }
      : {}),
  }

  const res = await fetch('/api/settings/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    throw new Error('Failed to save notification settings')
  }

  return res.json()
}
