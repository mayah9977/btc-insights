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

type NotificationSettingsErrorBody = {
  error?: string
  reason?: string
}

export class NotificationSettingsRequestError extends Error {
  readonly status: number
  readonly error?: string
  readonly reason?: string

  constructor({
    status,
    error,
    reason,
    fallbackMessage,
  }: {
    status: number
    error?: string
    reason?: string
    fallbackMessage: string
  }) {
    super(error ?? reason ?? fallbackMessage)

    this.name =
      'NotificationSettingsRequestError'

    this.status = status
    this.error = error
    this.reason = reason
  }
}

async function parseNotificationSettingsErrorBody(
  response: Response,
): Promise<NotificationSettingsErrorBody> {
  try {
    const body = await response.json()

    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body)
    ) {
      return {}
    }

    const candidate =
      body as Record<string, unknown>

    return {
      ...(typeof candidate.error === 'string'
        ? {
            error: candidate.error,
          }
        : {}),

      ...(typeof candidate.reason === 'string'
        ? {
            reason: candidate.reason,
          }
        : {}),
    }
  } catch {
    return {}
  }
}

async function throwNotificationSettingsRequestError(
  response: Response,
  fallbackMessage: string,
): Promise<never> {
  const body =
    await parseNotificationSettingsErrorBody(
      response,
    )

  throw new NotificationSettingsRequestError({
    status: response.status,
    error: body.error,
    reason: body.reason,
    fallbackMessage,
  })
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
    return throwNotificationSettingsRequestError(
      res,
      'Failed to fetch notification settings',
    )
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
    return throwNotificationSettingsRequestError(
      res,
      'Failed to save notification settings',
    )
  }

  return res.json()
}
