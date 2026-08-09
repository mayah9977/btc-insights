// lib/market/institutional/server/institutionalPatternRetryConsumer.ts

import { randomUUID } from 'crypto'

import { redis } from '@/lib/redis'
import { getAllValidVIPUserIds } from '@/lib/vip/vipDB'
import { getUserNotificationSettings } from '@/lib/notification/settingsStore.server'
import { saveNotificationDetailed } from '@/lib/notification/repository'
import { sendPushDetailedToUser } from '@/lib/push/pushSender'

export type ProcessInstitutionalPatternRetryBatchInput = {
  now?: number
  limit?: number
}

export type ProcessInstitutionalPatternRetryBatchResult = {
  scanned: number
  claimed: number
  succeeded: number
  rescheduled: number
  finalized: number
  skippedClaimed: number
  invalid: number
}

type InstitutionalPatternDeliveryChannel =
  | 'STORAGE'
  | 'SSE'
  | 'FCM'

type InstitutionalPatternDeliveryStatus =
  | 'SUCCEEDED'
  | 'SKIPPED_ALREADY_DELIVERED'
  | 'SKIPPED_FINAL'
  | 'FAILED_RETRYABLE'
  | 'FAILED_FINAL'

type InstitutionalPatternStoredDeliveryStatus =
  | InstitutionalPatternDeliveryStatus
  | 'PENDING'

type InstitutionalPatternNotificationPayload = {
  id: string
  type: 'INSTITUTIONAL_PATTERN'
  title: string
  body: string
  createdAt: number
}

type InstitutionalPatternAlertPayload = {
  type: 'INSTITUTIONAL_PATTERN_SIGNAL'
  pattern: string
  intensity: string
  risk: string
  summary: string
  confirmedCandleTs: number
  ts: number
  userId: string
}

type InstitutionalPatternPushPayload = {
  title: string
  body: string
  data: Record<string, string>
}

type InstitutionalPatternRetryPayload =
  | {
      version: 1
      deliveryId: string
      eventId: string
      userId: string
      channel: 'STORAGE'
      symbol: string
      patternType: string
      risk: string
      confirmedCandleTs: number
      attemptCount: number
      createdAt: number
      nextRetryAt: number
      payload: InstitutionalPatternNotificationPayload
    }
  | {
      version: 1
      deliveryId: string
      eventId: string
      userId: string
      channel: 'SSE'
      symbol: string
      patternType: string
      risk: string
      confirmedCandleTs: number
      attemptCount: number
      createdAt: number
      nextRetryAt: number
      payload: InstitutionalPatternAlertPayload
    }
  | {
      version: 1
      deliveryId: string
      eventId: string
      userId: string
      channel: 'FCM'
      symbol: string
      patternType: string
      risk: string
      confirmedCandleTs: number
      attemptCount: number
      createdAt: number
      nextRetryAt: number
      payload: InstitutionalPatternPushPayload
    }

type InstitutionalPatternDeliveryRecord = {
  version: 1
  deliveryId: string
  eventId: string
  userId: string
  channel: InstitutionalPatternDeliveryChannel
  status: InstitutionalPatternDeliveryStatus
  updatedAt: number
  errorClass?: string
}

type VerifiedInstitutionalPatternDeliveryRecord = {
  version: 1
  deliveryId: string
  eventId: string
  userId: string
  channel: InstitutionalPatternDeliveryChannel
  status: InstitutionalPatternStoredDeliveryStatus
}

type RetryPayloadValidationResult =
  | {
      status: 'VALID'
      payload: InstitutionalPatternRetryPayload
    }
  | {
      status: 'INVALID_FINALIZABLE'
      recordBase: {
        deliveryId: string
        eventId: string
        userId: string
        channel: InstitutionalPatternDeliveryChannel
      }
      errorClass: string
    }
  | {
      status: 'INVALID_UNSAFE'
    }

const RETRY_PENDING_ZSET_KEY =
  'institutional-pattern:retry:pending'

const CLAIM_TTL_MS = 120_000
const DELIVERY_TTL_MS = 604_800_000
const MAX_ATTEMPT_COUNT = 6

const COMPARE_AND_DELETE_SCRIPT = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end

return 0
`

const FINALIZE_RETRY_SCRIPT = `
if redis.call('GET', KEYS[4]) ~= ARGV[4] then
  return 0
end

redis.call(
  'SET',
  KEYS[1],
  ARGV[1],
  'PX',
  ARGV[2]
)

redis.call(
  'ZREM',
  KEYS[2],
  ARGV[3]
)

redis.call(
  'DEL',
  KEYS[3]
)

return 1
`

const RESCHEDULE_RETRY_SCRIPT = `
if redis.call('GET', KEYS[4]) ~= ARGV[6] then
  return 0
end

redis.call(
  'SET',
  KEYS[1],
  ARGV[1],
  'PX',
  ARGV[2]
)

redis.call(
  'ZADD',
  KEYS[2],
  ARGV[3],
  ARGV[4]
)

redis.call(
  'SET',
  KEYS[3],
  ARGV[5],
  'PX',
  ARGV[2]
)

return 1
`

const CLEANUP_RETRY_SCRIPT = `
if redis.call('GET', KEYS[3]) ~= ARGV[2] then
  return 0
end

redis.call(
  'ZREM',
  KEYS[1],
  ARGV[1]
)

redis.call(
  'DEL',
  KEYS[2]
)

return 1
`

function getRetryPayloadKey(
  deliveryId: string,
) {
  return (
    'institutional-pattern:retry:payload:' +
    deliveryId
  )
}

function getDeliveryStatusKey(
  deliveryId: string,
) {
  return (
    'institutional-pattern:delivery:' +
    deliveryId
  )
}

function getRetryClaimKey(
  deliveryId: string,
) {
  return (
    'institutional-pattern:retry:claim:' +
    deliveryId
  )
}

function normalizeErrorClass(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.name || 'Error'
  }

  if (
    error &&
    typeof error === 'object' &&
    'code' in error
  ) {
    const code = (
      error as {
        code?: unknown
      }
    ).code

    if (typeof code === 'string') {
      return code
    }
  }

  return typeof error
}

function isStoredDeliveryStatus(
  value: unknown,
): value is InstitutionalPatternStoredDeliveryStatus {
  return (
    value === 'PENDING' ||
    value === 'SUCCEEDED' ||
    value === 'SKIPPED_ALREADY_DELIVERED' ||
    value === 'SKIPPED_FINAL' ||
    value === 'FAILED_RETRYABLE' ||
    value === 'FAILED_FINAL'
  )
}

function isTerminalDeliveryStatus(
  status: InstitutionalPatternStoredDeliveryStatus,
) {
  return (
    status === 'SUCCEEDED' ||
    status === 'SKIPPED_ALREADY_DELIVERED' ||
    status === 'SKIPPED_FINAL' ||
    status === 'FAILED_FINAL'
  )
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  )
}

function isFiniteNumber(
  value: unknown,
): value is number {
  return (
    typeof value === 'number' &&
    Number.isFinite(value)
  )
}

function isStringRecord(
  value: unknown,
): value is Record<string, string> {
  if (!isRecord(value)) {
    return false
  }

  return Object.values(value).every(
    item => typeof item === 'string',
  )
}

function isDeliveryChannel(
  value: unknown,
): value is InstitutionalPatternDeliveryChannel {
  return (
    value === 'STORAGE' ||
    value === 'SSE' ||
    value === 'FCM'
  )
}

function isNotificationPayload(
  value: unknown,
): value is InstitutionalPatternNotificationPayload {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    value.type === 'INSTITUTIONAL_PATTERN' &&
    typeof value.title === 'string' &&
    typeof value.body === 'string' &&
    isFiniteNumber(value.createdAt)
  )
}

function isAlertPayload(
  value: unknown,
): value is InstitutionalPatternAlertPayload {
  if (!isRecord(value)) {
    return false
  }

  return (
    value.type ===
      'INSTITUTIONAL_PATTERN_SIGNAL' &&
    typeof value.pattern === 'string' &&
    typeof value.intensity === 'string' &&
    typeof value.risk === 'string' &&
    typeof value.summary === 'string' &&
    isFiniteNumber(
      value.confirmedCandleTs,
    ) &&
    isFiniteNumber(value.ts) &&
    typeof value.userId === 'string'
  )
}

function isPushPayload(
  value: unknown,
): value is InstitutionalPatternPushPayload {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.title === 'string' &&
    typeof value.body === 'string' &&
    isStringRecord(value.data)
  )
}

function getFinalizableRecordBase(
  value: unknown,
  deliveryId: string,
):
  | {
      deliveryId: string
      eventId: string
      userId: string
      channel: InstitutionalPatternDeliveryChannel
    }
  | null {
  if (!isRecord(value)) {
    return null
  }

  if (
    value.deliveryId !== deliveryId ||
    typeof value.eventId !== 'string' ||
    typeof value.userId !== 'string' ||
    !isDeliveryChannel(value.channel)
  ) {
    return null
  }

  return {
    deliveryId,
    eventId: value.eventId,
    userId: value.userId,
    channel: value.channel,
  }
}

function validateRetryPayload(
  value: unknown,
  deliveryId: string,
): RetryPayloadValidationResult {
  const recordBase =
    getFinalizableRecordBase(
      value,
      deliveryId,
    )

  if (!recordBase) {
    return {
      status: 'INVALID_UNSAFE',
    }
  }

  if (!isRecord(value)) {
    return {
      status: 'INVALID_UNSAFE',
    }
  }

  if (value.version !== 1) {
    return {
      status: 'INVALID_FINALIZABLE',
      recordBase,
      errorClass:
        'RetryPayloadVersionMismatch',
    }
  }

  if (
    typeof value.symbol !== 'string' ||
    typeof value.patternType !== 'string' ||
    typeof value.risk !== 'string' ||
    !isFiniteNumber(
      value.confirmedCandleTs,
    ) ||
    !isFiniteNumber(value.attemptCount) ||
    value.attemptCount < 0 ||
    !Number.isInteger(value.attemptCount) ||
    !isFiniteNumber(value.createdAt) ||
    !isFiniteNumber(value.nextRetryAt)
  ) {
    return {
      status: 'INVALID_FINALIZABLE',
      recordBase,
      errorClass:
        'RetryPayloadRequiredFieldInvalid',
    }
  }

  if (
    value.channel === 'STORAGE' &&
    isNotificationPayload(value.payload)
  ) {
    return {
      status: 'VALID',
      payload:
        value as InstitutionalPatternRetryPayload,
    }
  }

  if (
    value.channel === 'SSE' &&
    isAlertPayload(value.payload)
  ) {
    return {
      status: 'VALID',
      payload:
        value as InstitutionalPatternRetryPayload,
    }
  }

  if (
    value.channel === 'FCM' &&
    isPushPayload(value.payload)
  ) {
    return {
      status: 'VALID',
      payload:
        value as InstitutionalPatternRetryPayload,
    }
  }

  return {
    status: 'INVALID_FINALIZABLE',
    recordBase,
    errorClass:
      'RetryPayloadChannelPayloadInvalid',
  }
}

function getKoreanCurrentHour() {
  const hour = new Intl.DateTimeFormat(
    'en-US',
    {
      timeZone: 'Asia/Seoul',
      hour: '2-digit',
      hour12: false,
      hourCycle: 'h23',
    },
  ).format(new Date())

  return Number(hour)
}

function isQuietHours(
  quietHours:
    | {
        from: number
        to: number
      }
    | undefined,
) {
  if (!quietHours) {
    return false
  }

  const {
    from,
    to,
  } = quietHours

  if (from === to) {
    return false
  }

  const currentHour =
    getKoreanCurrentHour()

  if (from < to) {
    return (
      currentHour >= from &&
      currentHour < to
    )
  }

  return (
    currentHour >= from ||
    currentHour < to
  )
}

function getRetryDelayMs(
  attemptCount: number,
) {
  if (attemptCount === 1) {
    return 30_000
  }

  if (attemptCount === 2) {
    return 2 * 60_000
  }

  if (attemptCount === 3) {
    return 10 * 60_000
  }

  if (attemptCount === 4) {
    return 30 * 60_000
  }

  if (attemptCount === 5) {
    return 2 * 60 * 60_000
  }

  throw new Error(
    'Invalid institutional pattern retry attempt',
  )
}

async function getVerifiedDeliveryRecord(
  deliveryId: string,
): Promise<
  | {
      status: 'VALID'
      record: VerifiedInstitutionalPatternDeliveryRecord
    }
  | {
      status: 'INVALID_UNSAFE'
    }
> {
  const raw = await redis.get(
    getDeliveryStatusKey(deliveryId),
  )

  if (raw === null) {
    return {
      status: 'INVALID_UNSAFE',
    }
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    return {
      status: 'INVALID_UNSAFE',
    }
  }

  if (
    !isRecord(parsed) ||
    parsed.version !== 1 ||
    parsed.deliveryId !== deliveryId ||
    typeof parsed.eventId !== 'string' ||
    typeof parsed.userId !== 'string' ||
    !isDeliveryChannel(parsed.channel) ||
    !isStoredDeliveryStatus(parsed.status)
  ) {
    return {
      status: 'INVALID_UNSAFE',
    }
  }

  return {
    status: 'VALID',
    record: {
      version: 1,
      deliveryId,
      eventId: parsed.eventId,
      userId: parsed.userId,
      channel: parsed.channel,
      status: parsed.status,
    },
  }
}

async function releaseClaim(
  claimKey: string,
  token: string,
) {
  await redis.eval(
    COMPARE_AND_DELETE_SCRIPT,
    1,
    claimKey,
    token,
  )
}

async function cleanupRetry(
  deliveryId: string,
  claimKey: string,
  claimToken: string,
) {
  const result = await redis.eval(
    CLEANUP_RETRY_SCRIPT,
    3,
    RETRY_PENDING_ZSET_KEY,
    getRetryPayloadKey(deliveryId),
    claimKey,
    deliveryId,
    claimToken,
  )

  if (
    result !== 1 &&
    result !== '1'
  ) {
    throw new Error(
      'Institutional pattern retry cleanup failed',
    )
  }
}

async function finalizeRetry(params: {
  record: InstitutionalPatternDeliveryRecord
  claimKey: string
  claimToken: string
}) {
  const {
    record,
    claimKey,
    claimToken,
  } = params

  const result = await redis.eval(
    FINALIZE_RETRY_SCRIPT,
    4,
    getDeliveryStatusKey(
      record.deliveryId,
    ),
    RETRY_PENDING_ZSET_KEY,
    getRetryPayloadKey(
      record.deliveryId,
    ),
    claimKey,
    JSON.stringify(record),
    DELIVERY_TTL_MS,
    record.deliveryId,
    claimToken,
  )

  if (
    result !== 1 &&
    result !== '1'
  ) {
    throw new Error(
      'Institutional pattern retry finalization failed',
    )
  }
}

async function rescheduleRetry(params: {
  payload: InstitutionalPatternRetryPayload
  errorClass: string
  now: number
  claimKey: string
  claimToken: string
}) {
  const {
    payload,
    errorClass,
    now,
    claimKey,
    claimToken,
  } = params

  const nextAttemptCount =
    payload.attemptCount + 1

  if (
    nextAttemptCount >=
    MAX_ATTEMPT_COUNT
  ) {
    await finalizeRetry({
      record: {
        version: 1,
        deliveryId:
          payload.deliveryId,
        eventId:
          payload.eventId,
        userId:
          payload.userId,
        channel:
          payload.channel,
        status: 'FAILED_FINAL',
        updatedAt: now,
        errorClass,
      },
      claimKey,
      claimToken,
    })

    return {
      status: 'FINALIZED' as const,
    }
  }

  const nextRetryAt =
    now +
    getRetryDelayMs(
      nextAttemptCount,
    )

  const updatedPayload:
    InstitutionalPatternRetryPayload = {
      ...payload,
      attemptCount:
        nextAttemptCount,
      nextRetryAt,
    }

  const deliveryRecord:
    InstitutionalPatternDeliveryRecord = {
      version: 1,
      deliveryId:
        payload.deliveryId,
      eventId:
        payload.eventId,
      userId:
        payload.userId,
      channel:
        payload.channel,
      status: 'FAILED_RETRYABLE',
      updatedAt: now,
      errorClass,
    }

  const result = await redis.eval(
    RESCHEDULE_RETRY_SCRIPT,
    4,
    getRetryPayloadKey(
      payload.deliveryId,
    ),
    RETRY_PENDING_ZSET_KEY,
    getDeliveryStatusKey(
      payload.deliveryId,
    ),
    claimKey,
    JSON.stringify(updatedPayload),
    DELIVERY_TTL_MS,
    nextRetryAt,
    payload.deliveryId,
    JSON.stringify(deliveryRecord),
    claimToken,
  )

  if (
    result !== 1 &&
    result !== '1'
  ) {
    throw new Error(
      'Institutional pattern retry reschedule failed',
    )
  }

  return {
    status: 'RESCHEDULED' as const,
  }
}

async function finalizeWithStatus(params: {
  payload: InstitutionalPatternRetryPayload
  status: InstitutionalPatternDeliveryStatus
  now: number
  errorClass?: string
  claimKey: string
  claimToken: string
}) {
  const {
    payload,
    status,
    now,
    errorClass,
    claimKey,
    claimToken,
  } = params

  await finalizeRetry({
    record: {
      version: 1,
      deliveryId:
        payload.deliveryId,
      eventId:
        payload.eventId,
      userId:
        payload.userId,
      channel:
        payload.channel,
      status,
      updatedAt: now,
      ...(errorClass
        ? {
            errorClass,
          }
        : {}),
    },
    claimKey,
    claimToken,
  })
}

async function processStorageRetry(params: {
  payload: Extract<
    InstitutionalPatternRetryPayload,
    {
      channel: 'STORAGE'
    }
  >
  now: number
  claimKey: string
  claimToken: string
}) {
  const {
    payload,
    now,
    claimKey,
    claimToken,
  } = params

  try {
    const result =
      await saveNotificationDetailed(
        payload.userId,
        payload.payload,
      )

    const status:
      InstitutionalPatternDeliveryStatus =
      result.status === 'SAVED'
        ? 'SUCCEEDED'
        : 'SKIPPED_ALREADY_DELIVERED'

    await finalizeWithStatus({
      payload,
      status,
      now,
      claimKey,
      claimToken,
    })

    return (
      status === 'SUCCEEDED'
        ? 'SUCCEEDED'
        : 'FINALIZED'
    ) as
      | 'SUCCEEDED'
      | 'FINALIZED'
  } catch (error: unknown) {
    const retryResult =
      await rescheduleRetry({
        payload,
        errorClass:
          normalizeErrorClass(error),
        now,
        claimKey,
        claimToken,
      })

    return retryResult.status
  }
}

async function processFCMRetry(params: {
  payload: Extract<
    InstitutionalPatternRetryPayload,
    {
      channel: 'FCM'
    }
  >
  now: number
  claimKey: string
  claimToken: string
}) {
  const {
    payload,
    now,
    claimKey,
    claimToken,
  } = params

  try {
    const result =
      await sendPushDetailedToUser({
        userId:
          payload.userId,
        title:
          payload.payload.title,
        body:
          payload.payload.body,
        data:
          payload.payload.data,
      })

    try {
      console.log(
        '[InstitutionalPattern][FCM_RETRY_DIAGNOSTIC]',
        {
          confirmedCandleTs:
            payload.confirmedCandleTs,
          pattern:
            payload.patternType,
          detailedStatus:
            result.status,
          tokenCount:
            result.tokenCount,
          successCount:
            result.successCount,
          retryableFailureCount:
            result.retryableFailureCount,
          finalFailureCount:
            result.finalFailureCount,
          errorCodeCounts: {
            ...result.errorCodeCounts,
          },
          cleanupAttemptedCount:
            result.cleanup.attemptedCount,
          cleanupDeletedCount:
            result.cleanup.deletedCount,
          cleanupOwnerMismatchOrNotRemovedCount:
            result.cleanup
              .ownerMismatchOrNotRemovedCount,
          cleanupFailedCount:
            result.cleanup.failedCount,
        },
      )
    } catch {
      // Diagnostics must not affect retry processing.
    }

    if (
      result.status ===
        'SUCCEEDED_ALL' ||
      result.status ===
        'SUCCEEDED_PARTIAL'
    ) {
      await finalizeWithStatus({
        payload,
        status: 'SUCCEEDED',
        now,
        claimKey,
        claimToken,
      })

      return 'SUCCEEDED' as const
    }

    if (
      result.status ===
      'SKIPPED_NO_TOKEN'
    ) {
      await finalizeWithStatus({
        payload,
        status: 'SKIPPED_FINAL',
        now,
        claimKey,
        claimToken,
      })

      return 'FINALIZED' as const
    }

    if (
      result.status ===
      'FAILED_FINAL'
    ) {
      await finalizeWithStatus({
        payload,
        status: 'FAILED_FINAL',
        now,
        errorClass:
          result.status,
        claimKey,
        claimToken,
      })

      return 'FINALIZED' as const
    }

    const errorClass =
      result.status ===
        'FAILED_TOKEN_LOOKUP' ||
      result.status ===
        'FAILED_CALL'
        ? normalizeErrorClass(
            result.error,
          )
        : result.status

    const retryResult =
      await rescheduleRetry({
        payload,
        errorClass,
        now,
        claimKey,
        claimToken,
      })

    return retryResult.status
  } catch (error: unknown) {
    const retryResult =
      await rescheduleRetry({
        payload,
        errorClass:
          normalizeErrorClass(error),
        now,
        claimKey,
        claimToken,
      })

    return retryResult.status
  }
}

async function processClaimedRetry(params: {
  deliveryId: string
  validVIPUserIds: Set<string>
  now: number
  claimKey: string
  claimToken: string
}) {
  const {
    deliveryId,
    validVIPUserIds,
    now,
    claimKey,
    claimToken,
  } = params

  const deliveryRecordResult =
    await getVerifiedDeliveryRecord(
      deliveryId,
    )

  if (
    deliveryRecordResult.status ===
    'INVALID_UNSAFE'
  ) {
    await cleanupRetry(
      deliveryId,
      claimKey,
      claimToken,
    )

    return {
      status: 'INVALID' as const,
    }
  }

  const deliveryRecord =
    deliveryRecordResult.record

  if (
    isTerminalDeliveryStatus(
      deliveryRecord.status,
    )
  ) {
    await cleanupRetry(
      deliveryId,
      claimKey,
      claimToken,
    )

    return {
      status: 'FINALIZED' as const,
    }
  }

  if (
    deliveryRecord.status !==
    'FAILED_RETRYABLE'
  ) {
    throw new Error(
      'Institutional pattern retry delivery status is not retryable',
    )
  }

  const rawPayload =
    await redis.get(
      getRetryPayloadKey(
        deliveryId,
      ),
    )

  if (rawPayload === null) {
    await finalizeRetry({
      record: {
        version: 1,
        deliveryId:
          deliveryRecord.deliveryId,
        eventId:
          deliveryRecord.eventId,
        userId:
          deliveryRecord.userId,
        channel:
          deliveryRecord.channel,
        status: 'FAILED_FINAL',
        updatedAt: now,
        errorClass:
          'RetryPayloadMissing',
      },
      claimKey,
      claimToken,
    })

    return {
      status: 'INVALID' as const,
    }
  }

  let parsedPayload: unknown

  try {
    parsedPayload =
      JSON.parse(rawPayload)
  } catch {
    await finalizeRetry({
      record: {
        version: 1,
        deliveryId:
          deliveryRecord.deliveryId,
        eventId:
          deliveryRecord.eventId,
        userId:
          deliveryRecord.userId,
        channel:
          deliveryRecord.channel,
        status: 'FAILED_FINAL',
        updatedAt: now,
        errorClass:
          'RetryPayloadJSONInvalid',
      },
      claimKey,
      claimToken,
    })

    return {
      status: 'INVALID' as const,
    }
  }

  const validation =
    validateRetryPayload(
      parsedPayload,
      deliveryId,
    )

  if (
    validation.status ===
    'INVALID_UNSAFE'
  ) {
    await cleanupRetry(
      deliveryId,
      claimKey,
      claimToken,
    )

    return {
      status: 'INVALID' as const,
    }
  }

  if (
    validation.status ===
    'INVALID_FINALIZABLE'
  ) {
    await finalizeRetry({
      record: {
        version: 1,
        deliveryId:
          validation.recordBase
            .deliveryId,
        eventId:
          validation.recordBase
            .eventId,
        userId:
          validation.recordBase
            .userId,
        channel:
          validation.recordBase
            .channel,
        status: 'FAILED_FINAL',
        updatedAt: now,
        errorClass:
          validation.errorClass,
      },
      claimKey,
      claimToken,
    })

    return {
      status: 'INVALID' as const,
    }
  }

  const payload =
    validation.payload

  if (
    !validVIPUserIds.has(
      payload.userId,
    )
  ) {
    await finalizeWithStatus({
      payload,
      status: 'SKIPPED_FINAL',
      now,
      claimKey,
      claimToken,
    })

    return {
      status: 'FINALIZED' as const,
    }
  }

  let settings:
    Awaited<
      ReturnType<
        typeof getUserNotificationSettings
      >
    >

  try {
    settings =
      await getUserNotificationSettings(
        payload.userId,
      )
  } catch (error: unknown) {
    const retryResult =
      await rescheduleRetry({
        payload,
        errorClass:
          normalizeErrorClass(error),
        now,
        claimKey,
        claimToken,
      })

    return {
      status:
        retryResult.status,
    }
  }

  if (
    settings
      .institutionalPatternEnabled ===
    false
  ) {
    await finalizeWithStatus({
      payload,
      status: 'SKIPPED_FINAL',
      now,
      claimKey,
      claimToken,
    })

    return {
      status: 'FINALIZED' as const,
    }
  }

  if (
    settings.importance ===
      'CRITICAL_ONLY' &&
    payload.risk !== 'HIGH'
  ) {
    await finalizeWithStatus({
      payload,
      status: 'SKIPPED_FINAL',
      now,
      claimKey,
      claimToken,
    })

    return {
      status: 'FINALIZED' as const,
    }
  }

  if (
    payload.channel === 'SSE'
  ) {
    await finalizeWithStatus({
      payload,
      status: 'FAILED_FINAL',
      now,
      errorClass:
        'SSERetryProhibited',
      claimKey,
      claimToken,
    })

    return {
      status: 'FINALIZED' as const,
    }
  }

  if (
    payload.channel === 'FCM'
  ) {
    if (
      settings.pushEnabled === false ||
      isQuietHours(
        settings.quietHours,
      )
    ) {
      await finalizeWithStatus({
        payload,
        status: 'SKIPPED_FINAL',
        now,
        claimKey,
        claimToken,
      })

      return {
        status: 'FINALIZED' as const,
      }
    }

    return {
      status:
        await processFCMRetry({
          payload,
          now,
          claimKey,
          claimToken,
        }),
    }
  }

  return {
    status:
      await processStorageRetry({
        payload,
        now,
        claimKey,
        claimToken,
      }),
  }
}

export async function processInstitutionalPatternRetryBatch(
  input: ProcessInstitutionalPatternRetryBatchInput = {},
): Promise<ProcessInstitutionalPatternRetryBatchResult> {
  const now =
    input.now ?? Date.now()

  const limit =
    input.limit ?? 20

  if (
    !Number.isFinite(now) ||
    now < 0
  ) {
    throw new Error(
      'Invalid institutional pattern retry batch time',
    )
  }

  if (
    !Number.isInteger(limit) ||
    limit <= 0
  ) {
    throw new Error(
      'Invalid institutional pattern retry batch limit',
    )
  }

  const result:
    ProcessInstitutionalPatternRetryBatchResult = {
      scanned: 0,
      claimed: 0,
      succeeded: 0,
      rescheduled: 0,
      finalized: 0,
      skippedClaimed: 0,
      invalid: 0,
    }

  const validVIPUserIds =
    new Set(
      await getAllValidVIPUserIds(),
    )

  const dueDeliveryIds =
    await redis.zrangebyscore(
      RETRY_PENDING_ZSET_KEY,
      '-inf',
      now,
      'LIMIT',
      0,
      limit,
    )

  result.scanned =
    dueDeliveryIds.length

  for (
    const deliveryId of dueDeliveryIds
  ) {
    const claimKey =
      getRetryClaimKey(
        deliveryId,
      )

    const claimToken =
      randomUUID()

    const claimResult =
      await redis.set(
        claimKey,
        claimToken,
        'PX',
        CLAIM_TTL_MS,
        'NX',
      )

    if (claimResult !== 'OK') {
      result.skippedClaimed += 1
      continue
    }

    result.claimed += 1

    try {
      const itemResult =
        await processClaimedRetry({
          deliveryId,
          validVIPUserIds,
          now,
          claimKey,
          claimToken,
        })

      if (
        itemResult.status ===
        'SUCCEEDED'
      ) {
        result.succeeded += 1
      } else if (
        itemResult.status ===
        'RESCHEDULED'
      ) {
        result.rescheduled += 1
      } else if (
        itemResult.status ===
        'FINALIZED'
      ) {
        result.finalized += 1
      } else {
        result.invalid += 1
      }
    } finally {
      await releaseClaim(
        claimKey,
        claimToken,
      )
    }
  }

  return result
}
