// app/api/settings/notifications/route.ts

import {
  NextRequest,
  NextResponse,
} from 'next/server'

import { getCurrentUser } from '@/lib/auth/getCurrentUser'

import {
  getUserNotificationSettings,
  setUserNotificationSettings,
  type NotificationSettingsPatch,
} from '@/lib/notification/settingsStore'

export const dynamic = 'force-dynamic'

const ALLOWED_FIELDS = new Set([
  'sseEnabled',
  'pushEnabled',
  'importance',
  'quietHours',
  'soundEnabled',
  'vibrationEnabled',
  'soundType',
  'indicatorEnabled',
  'institutionalPatternEnabled',
])

const INDICATOR_FIELDS = new Set([
  'RSI',
  'MACD',
  'EMA',
])

const TIMEFRAME_FIELDS = new Set([
  '15m',
  '1h',
])

type JsonObject = Record<string, unknown>

type IndicatorEnabledPatch = NonNullable<
  NotificationSettingsPatch['indicatorEnabled']
>

type IndicatorValuePatch = NonNullable<
  IndicatorEnabledPatch['RSI']
>

function isJsonObject(
  value: unknown,
): value is JsonObject {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  )
}

function hasOwn(
  value: JsonObject,
  key: string,
): boolean {
  return Object.prototype.hasOwnProperty.call(
    value,
    key,
  )
}

function hasOnlyAllowedKeys(
  value: JsonObject,
  allowedKeys: Set<string>,
): boolean {
  return Object.keys(value).every(
    key => allowedKeys.has(key),
  )
}

function isValidImportance(
  value: unknown,
): value is 'ALL' | 'CRITICAL_ONLY' {
  return (
    value === 'ALL' ||
    value === 'CRITICAL_ONLY'
  )
}

function isValidSoundType(
  value: unknown,
): value is
  | 'default'
  | 'alert1'
  | 'alert2'
  | 'siren' {
  return (
    value === 'default' ||
    value === 'alert1' ||
    value === 'alert2' ||
    value === 'siren'
  )
}

function isValidHour(
  value: unknown,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 23
  )
}

function isValidQuietHours(
  value: unknown,
): boolean {
  if (value === null) {
    return true
  }

  if (!isJsonObject(value)) {
    return false
  }

  if (
    !hasOnlyAllowedKeys(
      value,
      new Set(['from', 'to']),
    )
  ) {
    return false
  }

  if (
    !hasOwn(value, 'from') ||
    !hasOwn(value, 'to')
  ) {
    return false
  }

  return (
    isValidHour(value.from) &&
    isValidHour(value.to)
  )
}

function isValidIndicatorValue(
  value: unknown,
): boolean {
  if (typeof value === 'boolean') {
    return true
  }

  if (!isJsonObject(value)) {
    return false
  }

  if (
    !hasOnlyAllowedKeys(
      value,
      TIMEFRAME_FIELDS,
    )
  ) {
    return false
  }

  return Object.values(value).every(
    timeframeValue =>
      typeof timeframeValue === 'boolean',
  )
}

function isValidIndicatorEnabled(
  value: unknown,
): boolean {
  if (!isJsonObject(value)) {
    return false
  }

  if (
    !hasOnlyAllowedKeys(
      value,
      INDICATOR_FIELDS,
    )
  ) {
    return false
  }

  return Object.values(value).every(
    isValidIndicatorValue,
  )
}

function isValidSettingsPatch(
  value: unknown,
): value is JsonObject {
  if (!isJsonObject(value)) {
    return false
  }

  if (
    !hasOnlyAllowedKeys(
      value,
      ALLOWED_FIELDS,
    )
  ) {
    return false
  }

  const booleanFields = [
    'sseEnabled',
    'pushEnabled',
    'soundEnabled',
    'vibrationEnabled',
    'institutionalPatternEnabled',
  ]

  for (const field of booleanFields) {
    if (
      hasOwn(value, field) &&
      typeof value[field] !== 'boolean'
    ) {
      return false
    }
  }

  if (
    hasOwn(value, 'importance') &&
    !isValidImportance(value.importance)
  ) {
    return false
  }

  if (
    hasOwn(value, 'soundType') &&
    !isValidSoundType(value.soundType)
  ) {
    return false
  }

  if (
    hasOwn(value, 'quietHours') &&
    !isValidQuietHours(value.quietHours)
  ) {
    return false
  }

  if (
    hasOwn(value, 'indicatorEnabled') &&
    !isValidIndicatorEnabled(
      value.indicatorEnabled,
    )
  ) {
    return false
  }

  return true
}

function cloneIndicatorValue(
  value: unknown,
): IndicatorValuePatch {
  if (typeof value === 'boolean') {
    return value
  }

  const timeframeValue =
    value as JsonObject

  return {
    ...(hasOwn(timeframeValue, '15m')
      ? {
          '15m':
            timeframeValue['15m'] as boolean,
        }
      : {}),
    ...(hasOwn(timeframeValue, '1h')
      ? {
          '1h':
            timeframeValue['1h'] as boolean,
        }
      : {}),
  }
}

function buildSettingsPatch(
  body: JsonObject,
): NotificationSettingsPatch {
  const patch: NotificationSettingsPatch = {
    ...(hasOwn(body, 'sseEnabled')
      ? {
          sseEnabled:
            body.sseEnabled as boolean,
        }
      : {}),
    ...(hasOwn(body, 'pushEnabled')
      ? {
          pushEnabled:
            body.pushEnabled as boolean,
        }
      : {}),
    ...(hasOwn(body, 'importance')
      ? {
          importance:
            body.importance as
              | 'ALL'
              | 'CRITICAL_ONLY',
        }
      : {}),
    ...(hasOwn(body, 'quietHours')
      ? body.quietHours === null
        ? {
            quietHours: null,
          }
        : {
            quietHours: {
              from: (
                body.quietHours as JsonObject
              ).from as number,
              to: (
                body.quietHours as JsonObject
              ).to as number,
            },
          }
      : {}),
    ...(hasOwn(body, 'soundEnabled')
      ? {
          soundEnabled:
            body.soundEnabled as boolean,
        }
      : {}),
    ...(hasOwn(body, 'vibrationEnabled')
      ? {
          vibrationEnabled:
            body.vibrationEnabled as boolean,
        }
      : {}),
    ...(hasOwn(body, 'soundType')
      ? {
          soundType:
            body.soundType as
              | 'default'
              | 'alert1'
              | 'alert2'
              | 'siren',
        }
      : {}),
    ...(hasOwn(
      body,
      'institutionalPatternEnabled',
    )
      ? {
          institutionalPatternEnabled:
            body.institutionalPatternEnabled as boolean,
        }
      : {}),
  }

  if (
    hasOwn(body, 'indicatorEnabled')
  ) {
    const indicatorValue =
      body.indicatorEnabled as JsonObject

    patch.indicatorEnabled = {
      ...(hasOwn(indicatorValue, 'RSI')
        ? {
            RSI: cloneIndicatorValue(
              indicatorValue.RSI,
            ),
          }
        : {}),
      ...(hasOwn(indicatorValue, 'MACD')
        ? {
            MACD: cloneIndicatorValue(
              indicatorValue.MACD,
            ),
          }
        : {}),
      ...(hasOwn(indicatorValue, 'EMA')
        ? {
            EMA: cloneIndicatorValue(
              indicatorValue.EMA,
            ),
          }
        : {}),
    }
  }

  return patch
}

/**
 * Check notification settings
 */
export async function GET(
  req: NextRequest,
) {
  /**
   * Latest auth structure:
   * Remove req passing
   */
  const user =
    await getCurrentUser()

  if (!user) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED' },
      { status: 401 },
    )
  }

  try {
    const settings =
      await getUserNotificationSettings(
        user.id,
      )

    return NextResponse.json(
      settings,
      {
        headers: {
          'Cache-Control':
            'no-store, no-cache',
        },
      },
    )
  } catch (error) {
    console.error(
      '[NOTIFICATION_SETTINGS][GET_STORE_ERROR]',
      error instanceof Error
        ? error.name
        : 'UnknownError',
    )

    return NextResponse.json(
      {
        ok: false,
        error: 'SETTINGS_UNAVAILABLE',
      },
      { status: 503 },
    )
  }
}

/**
 * Save notification settings
 */
export async function POST(
  req: NextRequest,
) {
  /**
   * Latest auth structure:
   * Remove req passing
   */
  const user =
    await getCurrentUser()

  if (!user) {
    return NextResponse.json(
      { error: 'UNAUTHORIZED' },
      { status: 401 },
    )
  }

  let body: unknown

  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      {
        ok: false,
        reason: 'invalid-json-body',
      },
      { status: 400 },
    )
  }

  if (!isValidSettingsPatch(body)) {
    return NextResponse.json(
      {
        ok: false,
        reason: 'invalid-payload',
      },
      { status: 400 },
    )
  }

  const patch = buildSettingsPatch(body)

  try {
    await setUserNotificationSettings(
      user.id,
      patch,
    )
  } catch (error) {
    console.error(
      '[NOTIFICATION_SETTINGS][POST_STORE_ERROR]',
      error instanceof Error
        ? error.name
        : 'UnknownError',
    )

    return NextResponse.json(
      {
        ok: false,
        error: 'SETTINGS_UNAVAILABLE',
      },
      { status: 503 },
    )
  }

  return NextResponse.json(
    { ok: true },
    {
      headers: {
        'Cache-Control':
          'no-store, no-cache',
      },
    },
  )
}
