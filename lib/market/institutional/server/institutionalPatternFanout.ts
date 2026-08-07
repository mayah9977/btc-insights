// lib/market/institutional/server/institutionalPatternFanout.ts

import { randomUUID } from 'crypto'

import type {
  InstitutionalPatternEvaluationResult,
} from '@/lib/market/institutional/server/institutionalPatternRuntime'

import type {
  InstitutionalReadyPatternPresentation,
} from '@/lib/market/institutional/institutionalLatestEvaluation'

import { getAllValidVIPUserIds } from '@/lib/vip/vipDB'
import { getUserNotificationSettings } from '@/lib/notification/settingsStore.server'
import { saveNotificationDetailed } from '@/lib/notification/repository'
import { sendPushDetailedToUser } from '@/lib/push/pushSender'
import { redis } from '@/lib/redis'

type InstitutionalPatternReadyEvaluation =
  Extract<
    InstitutionalPatternEvaluationResult,
    { status: 'READY' }
  >

export type InstitutionalPatternFanoutInput = {
  symbol: string
  evaluation: InstitutionalPatternReadyEvaluation
}

export type InstitutionalPatternDeliveryChannel =
  | 'STORAGE'
  | 'SSE'
  | 'FCM'

export type InstitutionalPatternDeliveryStatus =
  | 'SUCCEEDED'
  | 'SKIPPED_ALREADY_DELIVERED'
  | 'SKIPPED_FINAL'
  | 'FAILED_RETRYABLE'
  | 'FAILED_FINAL'

type InstitutionalPatternAlertPayload = {
  type: 'INSTITUTIONAL_PATTERN_SIGNAL'
  pattern: string
  intensity: string
  risk: string
  summary: string
  confirmedCandleTs: number
  ts: number
  userId: string
  readyPattern?:
    InstitutionalReadyPatternPresentation
}

type InstitutionalPatternNotificationPayload = {
  id: string
  type: 'INSTITUTIONAL_PATTERN'
  title: string
  body: string
  createdAt: number
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

export type InstitutionalPatternFanoutResult =
  | {
      status: 'COMPLETED'
      eventId: string
      userCount: number
      deliveryCounts: Record<
        InstitutionalPatternDeliveryStatus,
        number
      >
    }
  | {
      status: 'ALREADY_DONE'
      eventId: string
    }
  | {
      status: 'LEASE_BUSY'
      eventId: string
    }

const ALERTS_CHANNEL = 'realtime:alerts'

const LEASE_TTL_MS = 120_000
const DONE_TTL_MS = 604_800_000
const LEASE_HEARTBEAT_INTERVAL_MS = 40_000
const RETRY_DELAY_MS = 30_000

const RETRY_PENDING_ZSET_KEY =
  'institutional-pattern:retry:pending'

function getAdminUserIds(): string[] {
  return (
    process.env.ADMIN_USER_IDS ?? ''
  )
    .split(',')
    .map(userId => userId.trim())
    .filter(Boolean)
}

const COMPARE_AND_DELETE_SCRIPT = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end

return 0
`

const COMPARE_AND_PEXPIRE_SCRIPT = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call(
    'PEXPIRE',
    KEYS[1],
    ARGV[2]
  )
end

return 0
`

const RECORD_DONE_IF_OWNED_SCRIPT = `
if redis.call('GET', KEYS[1]) ~= ARGV[1] then
  return 0
end

redis.call(
  'SET',
  KEYS[2],
  ARGV[2],
  'PX',
  ARGV[3]
)

return 1
`

const ENQUEUE_RETRY_SCRIPT = `
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

function getLeaseKey(
  symbol: string,
  patternType: string,
  confirmedCandleTs: number,
) {
  return (
    'institutional-pattern:fanout:lease:' +
    `${symbol}:${patternType}:${confirmedCandleTs}`
  )
}

function getDoneKey(
  symbol: string,
  patternType: string,
  confirmedCandleTs: number,
) {
  return (
    'institutional-pattern:fanout:done:' +
    `${symbol}:${patternType}:${confirmedCandleTs}`
  )
}

function getDeliveryId(
  eventId: string,
  userId: string,
  channel: InstitutionalPatternDeliveryChannel,
) {
  return `${eventId}:${userId}:${channel}`
}

function getDeliveryStatusKey(
  deliveryId: string,
) {
  return (
    'institutional-pattern:delivery:' +
    deliveryId
  )
}

function getRetryPayloadKey(
  deliveryId: string,
) {
  return (
    'institutional-pattern:retry:payload:' +
    deliveryId
  )
}

type InstitutionalPatternStoredDeliveryStatus =
  | InstitutionalPatternDeliveryStatus
  | 'PENDING'

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

async function getExistingDeliveryStatus(
  deliveryId: string,
): Promise<
  InstitutionalPatternStoredDeliveryStatus | null
> {
  const raw = await redis.get(
    getDeliveryStatusKey(deliveryId),
  )

  if (raw === null) {
    return null
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new Error(
      'Invalid institutional pattern delivery status JSON',
    )
  }

  if (
    !parsed ||
    typeof parsed !== 'object'
  ) {
    throw new Error(
      'Invalid institutional pattern delivery status record',
    )
  }

  const status = (
    parsed as {
      status?: unknown
    }
  ).status

  if (!isStoredDeliveryStatus(status)) {
    throw new Error(
      'Invalid institutional pattern delivery status',
    )
  }

  return status
}

/**
 * Full fanout과 후속 retry consumer는 동일한 delivery status
 * 계약을 사용해야 합니다.
 *
 * PENDING 또는 status 없음만 신규 채널 실행이 가능합니다.
 * FAILED_RETRYABLE은 durable pending queue가 소유합니다.
 */
function isDeliveryAlreadyHandled(
  status:
    | InstitutionalPatternStoredDeliveryStatus
    | null,
) {
  if (
    status === null ||
    status === 'PENDING'
  ) {
    return false
  }

  if (
    status === 'SUCCEEDED' ||
    status === 'SKIPPED_ALREADY_DELIVERED' ||
    status === 'SKIPPED_FINAL' ||
    status === 'FAILED_FINAL' ||
    status === 'FAILED_RETRYABLE'
  ) {
    return true
  }

  throw new Error(
    'Unexpected persisted institutional pattern delivery status',
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

function createDeliveryCounts(): Record<
  InstitutionalPatternDeliveryStatus,
  number
> {
  return {
    SUCCEEDED: 0,
    SKIPPED_ALREADY_DELIVERED: 0,
    SKIPPED_FINAL: 0,
    FAILED_RETRYABLE: 0,
    FAILED_FINAL: 0,
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

async function releaseLease(
  leaseKey: string,
  token: string,
) {
  return redis.eval(
    COMPARE_AND_DELETE_SCRIPT,
    1,
    leaseKey,
    token,
  )
}

async function renewLease(
  leaseKey: string,
  token: string,
) {
  const result = await redis.eval(
    COMPARE_AND_PEXPIRE_SCRIPT,
    1,
    leaseKey,
    token,
    LEASE_TTL_MS,
  )

  return (
    result === 1 ||
    result === '1'
  )
}

async function recordDoneIfOwned(params: {
  leaseKey: string
  doneKey: string
  token: string
  eventId: string
}) {
  const {
    leaseKey,
    doneKey,
    token,
    eventId,
  } = params

  const result = await redis.eval(
    RECORD_DONE_IF_OWNED_SCRIPT,
    2,
    leaseKey,
    doneKey,
    token,
    eventId,
    DONE_TTL_MS,
  )

  if (
    result !== 1 &&
    result !== '1'
  ) {
    throw new Error(
      'Institutional pattern fanout lease lost',
    )
  }
}

async function persistTerminalDelivery(
  record: InstitutionalPatternDeliveryRecord,
) {
  await redis.set(
    getDeliveryStatusKey(record.deliveryId),
    JSON.stringify(record),
    'PX',
    DONE_TTL_MS,
  )
}

async function persistRetryableDelivery(params: {
  record: InstitutionalPatternDeliveryRecord
  retryPayload: InstitutionalPatternRetryPayload
}) {
  const {
    record,
    retryPayload,
  } = params

  const result = await redis.eval(
    ENQUEUE_RETRY_SCRIPT,
    3,
    getRetryPayloadKey(
      retryPayload.deliveryId,
    ),
    RETRY_PENDING_ZSET_KEY,
    getDeliveryStatusKey(
      record.deliveryId,
    ),
    JSON.stringify(retryPayload),
    DONE_TTL_MS,
    retryPayload.nextRetryAt,
    retryPayload.deliveryId,
    JSON.stringify(record),
  )

  if (
    result !== 1 &&
    result !== '1'
  ) {
    throw new Error(
      'Institutional pattern retry enqueue failed',
    )
  }
}

function createStorageRetryPayload(params: {
  deliveryId: string
  eventId: string
  userId: string
  symbol: string
  patternType: string
  risk: string
  confirmedCandleTs: number
  notification: InstitutionalPatternNotificationPayload
  now: number
}): InstitutionalPatternRetryPayload {
  const {
    deliveryId,
    eventId,
    userId,
    symbol,
    patternType,
    risk,
    confirmedCandleTs,
    notification,
    now,
  } = params

  return {
    version: 1,
    deliveryId,
    eventId,
    userId,
    channel: 'STORAGE',
    symbol,
    patternType,
    risk,
    confirmedCandleTs,
    attemptCount: 0,
    createdAt: now,
    nextRetryAt:
      now + RETRY_DELAY_MS,
    payload: notification,
  }
}

function createSSERetryPayload(params: {
  deliveryId: string
  eventId: string
  userId: string
  symbol: string
  patternType: string
  risk: string
  confirmedCandleTs: number
  alertPayload: InstitutionalPatternAlertPayload
  now: number
}): InstitutionalPatternRetryPayload {
  const {
    deliveryId,
    eventId,
    userId,
    symbol,
    patternType,
    risk,
    confirmedCandleTs,
    alertPayload,
    now,
  } = params

  return {
    version: 1,
    deliveryId,
    eventId,
    userId,
    channel: 'SSE',
    symbol,
    patternType,
    risk,
    confirmedCandleTs,
    attemptCount: 0,
    createdAt: now,
    nextRetryAt:
      now + RETRY_DELAY_MS,
    payload: alertPayload,
  }
}

function createFCMRetryPayload(params: {
  deliveryId: string
  eventId: string
  userId: string
  symbol: string
  patternType: string
  risk: string
  confirmedCandleTs: number
  pushPayload: InstitutionalPatternPushPayload
  now: number
}): InstitutionalPatternRetryPayload {
  const {
    deliveryId,
    eventId,
    userId,
    symbol,
    patternType,
    risk,
    confirmedCandleTs,
    pushPayload,
    now,
  } = params

  return {
    version: 1,
    deliveryId,
    eventId,
    userId,
    channel: 'FCM',
    symbol,
    patternType,
    risk,
    confirmedCandleTs,
    attemptCount: 0,
    createdAt: now,
    nextRetryAt:
      now + RETRY_DELAY_MS,
    payload: pushPayload,
  }
}

async function recordSkippedChannels(params: {
  eventId: string
  userId: string
  channels: InstitutionalPatternDeliveryChannel[]
  deliveryCounts: Record<
    InstitutionalPatternDeliveryStatus,
    number
  >
}) {
  const {
    eventId,
    userId,
    channels,
    deliveryCounts,
  } = params

  for (const channel of channels) {
    const deliveryId =
      getDeliveryId(
        eventId,
        userId,
        channel,
      )

    const existingStatus =
      await getExistingDeliveryStatus(
        deliveryId,
      )

    if (
      isDeliveryAlreadyHandled(
        existingStatus,
      )
    ) {
      deliveryCounts.SKIPPED_ALREADY_DELIVERED += 1
      continue
    }

    await persistTerminalDelivery({
      version: 1,
      deliveryId,
      eventId,
      userId,
      channel,
      status: 'SKIPPED_FINAL',
      updatedAt: Date.now(),
    })

    deliveryCounts.SKIPPED_FINAL += 1
  }
}

export async function fanoutInstitutionalPatternReady({
  symbol,
  evaluation,
}: InstitutionalPatternFanoutInput): Promise<InstitutionalPatternFanoutResult> {
  if (
    evaluation.status !== 'READY'
  ) {
    throw new Error(
      'Institutional pattern fanout requires READY evaluation',
    )
  }

  const {
    detectedPattern,
    confirmedCandleTs,
  } = evaluation

  const eventId =
    `${symbol}:${detectedPattern.type}:${confirmedCandleTs}`

  const leaseKey =
    getLeaseKey(
      symbol,
      detectedPattern.type,
      confirmedCandleTs,
    )

  const doneKey =
    getDoneKey(
      symbol,
      detectedPattern.type,
      confirmedCandleTs,
    )

  const doneExists =
    await redis.exists(doneKey)

  if (doneExists === 1) {
    return {
      status: 'ALREADY_DONE',
      eventId,
    }
  }

  const token = randomUUID()

  const leaseResult = await redis.set(
    leaseKey,
    token,
    'PX',
    LEASE_TTL_MS,
    'NX',
  )

  if (leaseResult !== 'OK') {
    return {
      status: 'LEASE_BUSY',
      eventId,
    }
  }

  const doneAfterLease =
    await redis.exists(doneKey)

  if (doneAfterLease === 1) {
    await releaseLease(
      leaseKey,
      token,
    )

    return {
      status: 'ALREADY_DONE',
      eventId,
    }
  }

  let leaseHealthy = true

  const heartbeatTimer = setInterval(
    () => {
      void renewLease(
        leaseKey,
        token,
      )
        .then(renewed => {
          if (!renewed) {
            leaseHealthy = false
          }
        })
        .catch(() => {
          leaseHealthy = false
        })
    },
    LEASE_HEARTBEAT_INTERVAL_MS,
  )

  const deliveryCounts =
    createDeliveryCounts()

  try {
    const validVipUserIds =
      await getAllValidVIPUserIds()

    const adminUserIds =
      getAdminUserIds()

    const userIds = [
      ...new Set([
        ...validVipUserIds,
        ...adminUserIds,
      ]),
    ]

    const notification:
      InstitutionalPatternNotificationPayload = {
        id: eventId,
        type: 'INSTITUTIONAL_PATTERN',
        title: 'Institutional Flow Signal',
        body:
          `${detectedPattern.type} · ` +
          detectedPattern.intensity,
        createdAt: confirmedCandleTs,
      }

    const pushPayload:
      InstitutionalPatternPushPayload = {
        title: 'Institutional Flow Signal',
        body:
          `${detectedPattern.type} · ` +
          detectedPattern.intensity,
        data: {
          type:
            'INSTITUTIONAL_PATTERN_SIGNAL',
          eventId,
          symbol,
          pattern:
            detectedPattern.type,
          intensity:
            detectedPattern.intensity,
          risk:
            detectedPattern.risk,
          summary:
            detectedPattern.summary,
          confirmedCandleTs:
            String(confirmedCandleTs),
        },
      }

    for (const userId of userIds) {
      const now = Date.now()

      const alertPayload:
        InstitutionalPatternAlertPayload = {
          type:
            'INSTITUTIONAL_PATTERN_SIGNAL',
          pattern:
            detectedPattern.type,
          intensity:
            detectedPattern.intensity,
          risk:
            detectedPattern.risk,
          summary:
            detectedPattern.summary,
          confirmedCandleTs,
          ts: now,
          userId,
          readyPattern:
            detectedPattern,
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
            userId,
          )
      } catch (error: unknown) {
        const errorClass =
          normalizeErrorClass(error)

        for (
          const channel of [
            'STORAGE',
            'SSE',
            'FCM',
          ] as const
        ) {
          const deliveryId =
            getDeliveryId(
              eventId,
              userId,
              channel,
            )

          const existingStatus =
            await getExistingDeliveryStatus(
              deliveryId,
            )

          if (
            isDeliveryAlreadyHandled(
              existingStatus,
            )
          ) {
            deliveryCounts.SKIPPED_ALREADY_DELIVERED += 1
            continue
          }

          const record:
            InstitutionalPatternDeliveryRecord = {
              version: 1,
              deliveryId,
              eventId,
              userId,
              channel,
              status:
                'FAILED_RETRYABLE',
              updatedAt: now,
              errorClass,
            }

          const retryPayload =
            channel === 'STORAGE'
              ? createStorageRetryPayload({
                  deliveryId,
                  eventId,
                  userId,
                  symbol,
                  patternType:
                    detectedPattern.type,
                  risk:
                    detectedPattern.risk,
                  confirmedCandleTs,
                  notification,
                  now,
                })
              : channel === 'SSE'
                ? createSSERetryPayload({
                    deliveryId,
                    eventId,
                    userId,
                    symbol,
                    patternType:
                      detectedPattern.type,
                    risk:
                      detectedPattern.risk,
                    confirmedCandleTs,
                    alertPayload,
                    now,
                  })
                : createFCMRetryPayload({
                    deliveryId,
                    eventId,
                    userId,
                    symbol,
                    patternType:
                      detectedPattern.type,
                    risk:
                      detectedPattern.risk,
                    confirmedCandleTs,
                    pushPayload,
                    now,
                  })

          await persistRetryableDelivery({
            record,
            retryPayload,
          })

          deliveryCounts.FAILED_RETRYABLE += 1
        }

        continue
      }

      if (
        settings
          .institutionalPatternEnabled ===
        false
      ) {
        await recordSkippedChannels({
          eventId,
          userId,
          channels: [
            'STORAGE',
            'SSE',
            'FCM',
          ],
          deliveryCounts,
        })

        continue
      }

      if (
        settings.importance ===
          'CRITICAL_ONLY' &&
        detectedPattern.risk !== 'HIGH'
      ) {
        await recordSkippedChannels({
          eventId,
          userId,
          channels: [
            'STORAGE',
            'SSE',
            'FCM',
          ],
          deliveryCounts,
        })

        continue
      }

      const quiet =
        isQuietHours(
          settings.quietHours,
        )

      const storageDeliveryId =
        getDeliveryId(
          eventId,
          userId,
          'STORAGE',
        )

      const existingStorageStatus =
        await getExistingDeliveryStatus(
          storageDeliveryId,
        )

      if (
        isDeliveryAlreadyHandled(
          existingStorageStatus,
        )
      ) {
        deliveryCounts.SKIPPED_ALREADY_DELIVERED += 1
      } else {
        try {
          const storageResult =
            await saveNotificationDetailed(
              userId,
              notification,
            )

          const storageStatus:
            InstitutionalPatternDeliveryStatus =
            storageResult.status === 'SAVED'
              ? 'SUCCEEDED'
              : 'SKIPPED_ALREADY_DELIVERED'

          await persistTerminalDelivery({
            version: 1,
            deliveryId:
              storageDeliveryId,
            eventId,
            userId,
            channel: 'STORAGE',
            status: storageStatus,
            updatedAt: Date.now(),
          })

          deliveryCounts[storageStatus] += 1
        } catch (error: unknown) {
          const errorClass =
            normalizeErrorClass(error)

          const record:
            InstitutionalPatternDeliveryRecord = {
              version: 1,
              deliveryId:
                storageDeliveryId,
              eventId,
              userId,
              channel: 'STORAGE',
              status:
                'FAILED_RETRYABLE',
              updatedAt: Date.now(),
              errorClass,
            }

          await persistRetryableDelivery({
            record,
            retryPayload:
              createStorageRetryPayload({
                deliveryId:
                  storageDeliveryId,
                eventId,
                userId,
                symbol,
                patternType:
                  detectedPattern.type,
                risk:
                  detectedPattern.risk,
                confirmedCandleTs,
                notification,
                now,
              }),
          })

          deliveryCounts.FAILED_RETRYABLE += 1
        }
      }

      const sseDeliveryId =
        getDeliveryId(
          eventId,
          userId,
          'SSE',
        )

      const existingSSEStatus =
        await getExistingDeliveryStatus(
          sseDeliveryId,
        )

      if (
        isDeliveryAlreadyHandled(
          existingSSEStatus,
        )
      ) {
        deliveryCounts.SKIPPED_ALREADY_DELIVERED += 1
      } else if (
        quiet ||
        settings.sseEnabled === false
      ) {
        await persistTerminalDelivery({
          version: 1,
          deliveryId:
            sseDeliveryId,
          eventId,
          userId,
          channel: 'SSE',
          status: 'SKIPPED_FINAL',
          updatedAt: Date.now(),
        })

        deliveryCounts.SKIPPED_FINAL += 1
      } else {
        try {
          await redis.publish(
            ALERTS_CHANNEL,
            JSON.stringify(
              alertPayload,
            ),
          )

          await persistTerminalDelivery({
            version: 1,
            deliveryId:
              sseDeliveryId,
            eventId,
            userId,
            channel: 'SSE',
            status: 'SUCCEEDED',
            updatedAt: Date.now(),
          })

          deliveryCounts.SUCCEEDED += 1
        } catch (error: unknown) {
          await persistTerminalDelivery({
            version: 1,
            deliveryId:
              sseDeliveryId,
            eventId,
            userId,
            channel: 'SSE',
            status: 'FAILED_FINAL',
            updatedAt: Date.now(),
            errorClass:
              normalizeErrorClass(error),
          })

          deliveryCounts.FAILED_FINAL += 1
        }
      }

      const fcmDeliveryId =
        getDeliveryId(
          eventId,
          userId,
          'FCM',
        )

      const existingFCMStatus =
        await getExistingDeliveryStatus(
          fcmDeliveryId,
        )

      if (
        isDeliveryAlreadyHandled(
          existingFCMStatus,
        )
      ) {
        deliveryCounts.SKIPPED_ALREADY_DELIVERED += 1
      } else if (
        quiet ||
        settings.pushEnabled === false
      ) {
        await persistTerminalDelivery({
          version: 1,
          deliveryId:
            fcmDeliveryId,
          eventId,
          userId,
          channel: 'FCM',
          status: 'SKIPPED_FINAL',
          updatedAt: Date.now(),
        })

        deliveryCounts.SKIPPED_FINAL += 1
      } else {
        try {
          const fcmResult =
            await sendPushDetailedToUser({
              userId,
              title: pushPayload.title,
              body: pushPayload.body,
              data: pushPayload.data,
            })

          if (
            fcmResult.status ===
              'SUCCEEDED_ALL' ||
            fcmResult.status ===
              'SUCCEEDED_PARTIAL'
          ) {
            await persistTerminalDelivery({
              version: 1,
              deliveryId:
                fcmDeliveryId,
              eventId,
              userId,
              channel: 'FCM',
              status: 'SUCCEEDED',
              updatedAt: Date.now(),
            })

            deliveryCounts.SUCCEEDED += 1
          } else if (
            fcmResult.status ===
            'SKIPPED_NO_TOKEN'
          ) {
            await persistTerminalDelivery({
              version: 1,
              deliveryId:
                fcmDeliveryId,
              eventId,
              userId,
              channel: 'FCM',
              status: 'SKIPPED_FINAL',
              updatedAt: Date.now(),
            })

            deliveryCounts.SKIPPED_FINAL += 1
          } else if (
            fcmResult.status ===
            'FAILED_FINAL'
          ) {
            await persistTerminalDelivery({
              version: 1,
              deliveryId:
                fcmDeliveryId,
              eventId,
              userId,
              channel: 'FCM',
              status: 'FAILED_FINAL',
              updatedAt: Date.now(),
              errorClass:
                fcmResult.status,
            })

            deliveryCounts.FAILED_FINAL += 1
          } else {
            const errorClass =
              fcmResult.status ===
                'FAILED_TOKEN_LOOKUP' ||
              fcmResult.status ===
                'FAILED_CALL'
                ? normalizeErrorClass(
                    fcmResult.error,
                  )
                : fcmResult.status

            const record:
              InstitutionalPatternDeliveryRecord = {
                version: 1,
                deliveryId:
                  fcmDeliveryId,
                eventId,
                userId,
                channel: 'FCM',
                status:
                  'FAILED_RETRYABLE',
                updatedAt: Date.now(),
                errorClass,
              }

            await persistRetryableDelivery({
              record,
              retryPayload:
                createFCMRetryPayload({
                  deliveryId:
                    fcmDeliveryId,
                  eventId,
                  userId,
                  symbol,
                  patternType:
                    detectedPattern.type,
                  risk:
                    detectedPattern.risk,
                  confirmedCandleTs,
                  pushPayload,
                  now,
                }),
            })

            deliveryCounts.FAILED_RETRYABLE += 1
          }
        } catch (error: unknown) {
          const record:
            InstitutionalPatternDeliveryRecord = {
              version: 1,
              deliveryId:
                fcmDeliveryId,
              eventId,
              userId,
              channel: 'FCM',
              status:
                'FAILED_RETRYABLE',
              updatedAt: Date.now(),
              errorClass:
                normalizeErrorClass(error),
            }

          await persistRetryableDelivery({
            record,
            retryPayload:
              createFCMRetryPayload({
                deliveryId:
                  fcmDeliveryId,
                eventId,
                userId,
                symbol,
                patternType:
                  detectedPattern.type,
                risk:
                  detectedPattern.risk,
                confirmedCandleTs,
                pushPayload,
                now,
              }),
          })

          deliveryCounts.FAILED_RETRYABLE += 1
        }
      }
    }

    if (!leaseHealthy) {
      throw new Error(
        'Institutional pattern fanout lease heartbeat failed',
      )
    }

    await recordDoneIfOwned({
      leaseKey,
      doneKey,
      token,
      eventId,
    })

    await releaseLease(
      leaseKey,
      token,
    )

    return {
      status: 'COMPLETED',
      eventId,
      userCount: userIds.length,
      deliveryCounts,
    }
  } finally {
    clearInterval(heartbeatTimer)
  }
}
