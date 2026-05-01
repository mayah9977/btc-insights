// lib/notification/settingsClient.ts

export type NotificationSettings = {
  pushEnabled: boolean
  importance: 'ALL' | 'CRITICAL_ONLY'
  quietHours?: {
    from: number
    to: number
  }
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
  settings: NotificationSettings,
) {
  const res = await fetch('/api/settings/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
    },
    body: JSON.stringify(settings),
  })

  if (!res.ok) {
    throw new Error('Failed to save notification settings')
  }

  return res.json()
}
