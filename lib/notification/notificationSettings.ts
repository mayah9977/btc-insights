// lib/notification/notificationSettings.ts

export type NotificationImportance =
  | 'ALL'
  | 'CRITICAL_ONLY'

export type QuietHours = {
  from: number // 0 ~ 23
  to: number // 0 ~ 23
}

export type IndicatorType =
  | 'RSI'
  | 'MACD'
  | 'EMA'

export type IndicatorTimeframe =
  | '15m'
  | '1h'

export type IndicatorTimeframeEnabled =
  Record<IndicatorTimeframe, boolean>

export type IndicatorEnabled =
  Record<
    IndicatorType,
    IndicatorTimeframeEnabled
  >

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

  /**
   * Timeframe-aware indicator alert settings.
   *
   * RSI/MACD/EMA 각각에 대해
   * 15m momentum layer 와 1h structure layer 를
   * 독립적으로 제어합니다.
   */
  indicatorEnabled: IndicatorEnabled

  /**
   * Institutional pressure / flow alert
   *
   * RSI/MACD/EMA technical indicator 와
   * 분리된 branch 로 유지합니다.
   */
  institutionalPatternEnabled: boolean
}

/** 기본값 */
export const defaultNotificationSettings: NotificationSettings =
  {
    sseEnabled: true,
    pushEnabled: true,
    importance: 'ALL',

    soundEnabled: true,
    vibrationEnabled: true,
    soundType: 'default',

    indicatorEnabled: {
      RSI: {
        '15m': true,
        '1h': true,
      },

      MACD: {
        '15m': true,
        '1h': true,
      },

      EMA: {
        '15m': true,
        '1h': true,
      },
    },

    institutionalPatternEnabled: true,
  }

function isBoolean(
  value: unknown,
): value is boolean {
  return typeof value === 'boolean'
}

function isNotificationImportance(
  value: unknown,
): value is NotificationImportance {
  return (
    value === 'ALL' ||
    value === 'CRITICAL_ONLY'
  )
}

function isNotificationSound(
  value: unknown,
): value is NotificationSound {
  return (
    value === 'default' ||
    value === 'alert1' ||
    value === 'alert2' ||
    value === 'siren'
  )
}

function normalizeQuietHours(
  value: unknown,
): QuietHours | undefined {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    return undefined
  }

  const candidate =
    value as Partial<QuietHours>

  const from =
    typeof candidate.from ===
      'number' &&
    Number.isFinite(candidate.from)
      ? candidate.from
      : undefined

  const to =
    typeof candidate.to ===
      'number' &&
    Number.isFinite(candidate.to)
      ? candidate.to
      : undefined

  if (
    from === undefined ||
    to === undefined
  ) {
    return undefined
  }

  return {
    from: Math.min(
      Math.max(Math.floor(from), 0),
      23,
    ),

    to: Math.min(
      Math.max(Math.floor(to), 0),
      23,
    ),
  }
}

function normalizeIndicatorTimeframeEnabled(
  value: unknown,
  fallback: IndicatorTimeframeEnabled,
): IndicatorTimeframeEnabled {
  /**
   * Legacy migration:
   *
   * 기존 구조:
   * indicatorEnabled.RSI = true | false
   *
   * 신규 구조:
   * indicatorEnabled.RSI = {
   *   '15m': boolean,
   *   '1h': boolean,
   * }
   */
  if (isBoolean(value)) {
    return {
      '15m': value,
      '1h': value,
    }
  }

  if (
    !value ||
    typeof value !== 'object'
  ) {
    return {
      ...fallback,
    }
  }

  const candidate =
    value as Partial<
      Record<
        IndicatorTimeframe,
        unknown
      >
    >

  return {
    '15m': isBoolean(
      candidate['15m'],
    )
      ? candidate['15m']
      : fallback['15m'],

    '1h': isBoolean(
      candidate['1h'],
    )
      ? candidate['1h']
      : fallback['1h'],
  }
}

function normalizeIndicatorEnabled(
  value: unknown,
): IndicatorEnabled {
  const fallback =
    defaultNotificationSettings
      .indicatorEnabled

  if (
    !value ||
    typeof value !== 'object'
  ) {
    return {
      RSI: {
        ...fallback.RSI,
      },

      MACD: {
        ...fallback.MACD,
      },

      EMA: {
        ...fallback.EMA,
      },
    }
  }

  const candidate =
    value as Partial<
      Record<
        IndicatorType,
        unknown
      >
    >

  return {
    RSI:
      normalizeIndicatorTimeframeEnabled(
        candidate.RSI,
        fallback.RSI,
      ),

    MACD:
      normalizeIndicatorTimeframeEnabled(
        candidate.MACD,
        fallback.MACD,
      ),

    EMA:
      normalizeIndicatorTimeframeEnabled(
        candidate.EMA,
        fallback.EMA,
      ),
  }
}

/**
 * Persisted settings migration-safe normalizer.
 *
 * 기존 persisted settings 에
 * institutionalPatternEnabled 가 없으면
 * default(true) 로 자동 보정합니다.
 *
 * 기존 indicatorEnabled boolean 구조는
 * timeframe-aware 구조로 자동 보정합니다.
 */
export function normalizeNotificationSettings(
  value: unknown,
): NotificationSettings {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    return {
      ...defaultNotificationSettings,

      indicatorEnabled:
        normalizeIndicatorEnabled(
          defaultNotificationSettings
            .indicatorEnabled,
        ),
    }
  }

  const candidate =
    value as Partial<NotificationSettings>

  const quietHours =
    normalizeQuietHours(
      candidate.quietHours,
    )

  return {
    sseEnabled: isBoolean(
      candidate.sseEnabled,
    )
      ? candidate.sseEnabled
      : defaultNotificationSettings.sseEnabled,

    pushEnabled: isBoolean(
      candidate.pushEnabled,
    )
      ? candidate.pushEnabled
      : defaultNotificationSettings.pushEnabled,

    importance:
      isNotificationImportance(
        candidate.importance,
      )
        ? candidate.importance
        : defaultNotificationSettings
            .importance,

    ...(quietHours
      ? { quietHours }
      : {}),

    soundEnabled: isBoolean(
      candidate.soundEnabled,
    )
      ? candidate.soundEnabled
      : defaultNotificationSettings
          .soundEnabled,

    vibrationEnabled: isBoolean(
      candidate.vibrationEnabled,
    )
      ? candidate.vibrationEnabled
      : defaultNotificationSettings
          .vibrationEnabled,

    soundType:
      isNotificationSound(
        candidate.soundType,
      )
        ? candidate.soundType
        : defaultNotificationSettings
            .soundType,

    indicatorEnabled:
      normalizeIndicatorEnabled(
        candidate.indicatorEnabled,
      ),

    institutionalPatternEnabled:
      isBoolean(
        candidate.institutionalPatternEnabled,
      )
        ? candidate.institutionalPatternEnabled
        : defaultNotificationSettings
            .institutionalPatternEnabled,
  }
}
