// lib/notification/settingsStore.server.ts

import { redis } from '@/lib/redis'

import {
  defaultNotificationSettings,
  normalizeNotificationSettings,
  type NotificationSettings,
} from './notificationSettings'

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
  quietHours?:
    | NotificationSettings['quietHours']
    | null
  indicatorEnabled?: IndicatorEnabledPatch
}

const NOTIFICATION_SETTINGS_PREFIX =
  'notification:settings'

function getNotificationSettingsKey(
  userId: string,
): string {
  if (
    typeof userId !== 'string' ||
    userId.trim().length === 0
  ) {
    throw new Error(
      'Notification settings userId is required',
    )
  }

  const normalizedUserId = userId.trim()

  return `${NOTIFICATION_SETTINGS_PREFIX}:${normalizedUserId}`
}

function getDefaultSettings(): NotificationSettings {
  return normalizeNotificationSettings(
    defaultNotificationSettings,
  )
}

function parseStoredSettings(
  raw: string,
): NotificationSettings {
  const parsed = JSON.parse(raw)

  return normalizeNotificationSettings(
    parsed,
  )
}

function mergeIndicatorTimeframeSettings(
  existing: NotificationSettings['indicatorEnabled'][keyof NotificationSettings['indicatorEnabled']],
  patch: unknown,
): unknown {
  if (patch === undefined) {
    return {
      ...existing,
    }
  }

  if (typeof patch === 'boolean') {
    return patch
  }

  if (
    patch &&
    typeof patch === 'object'
  ) {
    return {
      ...existing,
      ...patch,
    }
  }

  return patch
}

function mergeIndicatorSettings(
  existing: NotificationSettings['indicatorEnabled'],
  patch: IndicatorEnabledPatch | undefined,
): unknown {
  if (patch === undefined) {
    return {
      RSI: {
        ...existing.RSI,
      },
      MACD: {
        ...existing.MACD,
      },
      EMA: {
        ...existing.EMA,
      },
    }
  }

  return {
    RSI: mergeIndicatorTimeframeSettings(
      existing.RSI,
      patch.RSI,
    ),
    MACD: mergeIndicatorTimeframeSettings(
      existing.MACD,
      patch.MACD,
    ),
    EMA: mergeIndicatorTimeframeSettings(
      existing.EMA,
      patch.EMA,
    ),
  }
}

function mergeSettings(
  existing: NotificationSettings,
  patch: NotificationSettingsPatch,
): NotificationSettings {
  const {
    quietHours: existingQuietHours,
    ...existingWithoutQuietHours
  } = existing

  const {
    indicatorEnabled: indicatorEnabledPatch,
    quietHours: quietHoursPatch,
    ...topLevelPatch
  } = patch

  const merged = {
    ...existingWithoutQuietHours,
    ...topLevelPatch,

    ...(quietHoursPatch === undefined
      ? existingQuietHours
        ? {
            quietHours: {
              ...existingQuietHours,
            },
          }
        : {}
      : quietHoursPatch === null
        ? {}
        : {
            quietHours: {
              ...quietHoursPatch,
            },
          }),

    indicatorEnabled:
      mergeIndicatorSettings(
        existing.indicatorEnabled,
        indicatorEnabledPatch,
      ),
  }

  return normalizeNotificationSettings(
    merged,
  )
}

export async function getUserNotificationSettings(
  userId: string,
): Promise<NotificationSettings> {
  const key =
    getNotificationSettingsKey(userId)

  const raw = await redis.get(key)

  if (raw === null) {
    return getDefaultSettings()
  }

  return parseStoredSettings(raw)
}

export async function saveUserNotificationSettings(
  userId: string,
  settings: NotificationSettings,
): Promise<NotificationSettings> {
  const key =
    getNotificationSettingsKey(userId)

  const savedSettings =
    normalizeNotificationSettings(
      settings,
    )

  await redis.set(
    key,
    JSON.stringify(savedSettings),
  )

  return savedSettings
}

export async function setUserNotificationSettings(
  userId: string,
  patch: NotificationSettingsPatch,
): Promise<NotificationSettings> {
  const key =
    getNotificationSettingsKey(userId)

  const existing =
    await getUserNotificationSettings(userId)

  const savedSettings = mergeSettings(
    existing,
    patch,
  )

  await redis.set(
    key,
    JSON.stringify(savedSettings),
  )

  return savedSettings
}
