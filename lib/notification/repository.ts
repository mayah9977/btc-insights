// lib/notification/repository.ts

import { redis } from '@/lib/redis'

export type NotificationType =
  | 'NOTICE'
  | 'BTC_ALERT'
  | 'INDICATOR'
  | 'INSTITUTIONAL_PATTERN'

export type NotificationItem = {
  id: string
  type: NotificationType
  title: string
  body: string
  createdAt: number
}

export type NotificationViewItem = NotificationItem & {
  read: boolean
}

const NOTIFICATION_ZSET_KEY_PREFIX = 'notification:list'
const NOTIFICATION_DEDUPE_KEY_PREFIX = 'notification:dedupe'
const NOTIFICATION_SHORT_DEDUPE_PREFIX = 'notification:dedupe:short'

function getNotificationZSetKey(userId: string) {
  return `${NOTIFICATION_ZSET_KEY_PREFIX}:${userId}`
}

function getNotificationDedupeKey(userId: string) {
  return `${NOTIFICATION_DEDUPE_KEY_PREFIX}:${userId}`
}

function getNotificationShortDedupeKey(
  userId: string,
  notificationId: string,
) {
  return `${NOTIFICATION_SHORT_DEDUPE_PREFIX}:${userId}:${notificationId}`
}

function getReadSetKey(viewerId: string) {
  return `notification:read:${viewerId}`
}

function parseNotification(raw: string): NotificationItem | null {
  try {
    return JSON.parse(raw) as NotificationItem
  } catch {
    return null
  }
}

function sortByLatest(a: NotificationItem, b: NotificationItem) {
  return b.createdAt - a.createdAt
}

function applyRoleFilter(
  notifications: NotificationItem[],
  isVIP: boolean,
) {
  if (isVIP) return notifications

  return notifications.filter(item => item.type === 'NOTICE')
}

function isNotificationItem(value: unknown): value is NotificationItem {
  if (!value || typeof value !== 'object') return false

  const item = value as Record<string, unknown>

  return (
    typeof item.id === 'string' &&
    (item.type === 'NOTICE' ||
      item.type === 'BTC_ALERT' ||
      item.type === 'INDICATOR' ||
      item.type === 'INSTITUTIONAL_PATTERN') &&
    typeof item.title === 'string' &&
    typeof item.body === 'string' &&
    typeof item.createdAt === 'number'
  )
}

// 🔥 NEW
async function getAllRawNotificationRows(userId: string) {
  return redis.zrevrange(
    getNotificationZSetKey(userId),
    0,
    -1,
  )
}

// 🔥 NEW
async function removeNotificationRowsByIds(
  userId: string,
  ids: string[],
) {
  if (ids.length === 0) return 0

  const idSet = new Set(ids)
  const rows = await getAllRawNotificationRows(userId)

  const rawTargets = rows.filter(raw => {
    const parsed = parseNotification(raw)
    return parsed !== null && idSet.has(parsed.id)
  })

  let removed = 0

  if (rawTargets.length > 0) {
    removed = await redis.zrem(
      getNotificationZSetKey(userId),
      ...rawTargets,
    )
  }

  await redis.srem(
    getNotificationDedupeKey(userId),
    ...ids,
  )

  await redis.srem(
    getReadSetKey(userId),
    ...ids,
  )

  const shortDedupeKeys = ids.map(id =>
    getNotificationShortDedupeKey(
      userId,
      id,
    ),
  )

  if (shortDedupeKeys.length > 0) {
    await redis.del(...shortDedupeKeys)
  }

  return removed
}

/* ============================= */
/* 저장 로직 */
/* ============================= */
export async function saveNotification(
  userId: string,
  notification: NotificationItem,
) {
  if (!userId) {
    throw new Error('Invalid notification owner')
  }

  if (!isNotificationItem(notification)) {
    throw new Error('Invalid notification payload')
  }

  const shortKey =
    getNotificationShortDedupeKey(
      userId,
      notification.id,
    )

  const shortLock = await redis.set(
    shortKey,
    '1',
    'EX',
    30,
    'NX',
  )

  if (shortLock !== 'OK') {
    return
  }

  const dedupeKey =
    getNotificationDedupeKey(userId)

  const isDuplicate = await redis.sismember(
    dedupeKey,
    notification.id,
  )

  if (isDuplicate) return

  await redis.sadd(
    dedupeKey,
    notification.id,
  )
  await redis.expire(
    dedupeKey,
    12 * 60 * 60,
  )

  await redis.zadd(
    getNotificationZSetKey(userId),
    notification.createdAt,
    JSON.stringify(notification),
  )

  const olderThan = Date.now() - 24 * 60 * 60 * 1000
  await redis.zremrangebyscore(
    getNotificationZSetKey(userId),
    '-inf',
    olderThan,
  )
}

/* ============================= */
/* 기존 조회 */
/* ============================= */
export async function getRawNotificationsLast12h(
  userId: string,
) {
  const now = Date.now()
  const twelveHoursAgo = now - 12 * 60 * 60 * 1000

  const rows = await redis.zrevrangebyscore(
    getNotificationZSetKey(userId),
    now,
    twelveHoursAgo,
  )

  return rows
    .map(parseNotification)
    .filter((item): item is NotificationItem => item !== null)
    .sort(sortByLatest)
}

export async function getNotificationsLast12h(params: {
  viewerId: string
  isVIP: boolean
}) {
  const { viewerId, isVIP } = params

  const rawItems =
    await getRawNotificationsLast12h(
      viewerId,
    )
  const visibleItems = applyRoleFilter(rawItems, isVIP)

  const readIds = new Set(
    await redis.smembers(getReadSetKey(viewerId)),
  )

  const items: NotificationViewItem[] = visibleItems.map(item => ({
    ...item,
    read: readIds.has(item.id),
  }))

  return items
}

export async function getUnreadCountLast12h(params: {
  viewerId: string
  isVIP: boolean
}) {
  const items = await getNotificationsLast12h(params)
  return items.filter(item => !item.read).length
}

/* ============================= */
/* NOTICE 전용 */
/* ============================= */
export async function getNoticeNotifications(params: {
  viewerId: string
  isVIP: boolean
}) {
  const { viewerId, isVIP } = params

  const rows = await redis.zrevrange(
    getNotificationZSetKey(viewerId),
    0,
    -1,
  )

  const parsed = rows
    .map(parseNotification)
    .filter((item): item is NotificationItem => item !== null)
    .filter(item => item.type === 'NOTICE')
    .sort(sortByLatest)

  const visibleItems = applyRoleFilter(parsed, isVIP)

  const readIds = new Set(
    await redis.smembers(getReadSetKey(viewerId)),
  )

  const items: NotificationViewItem[] = visibleItems.map(item => ({
    ...item,
    read: readIds.has(item.id),
  }))

  return items
}

/* ============================= */
/* read 처리 */
/* ============================= */
export async function markNotificationsRead(params: {
  viewerId: string
  isVIP: boolean
  ids?: string[]
}) {
  const { viewerId, isVIP, ids } = params
  const readKey = getReadSetKey(viewerId)

  let targetIds = ids ?? []

  if (targetIds.length === 0) {
    const visibleItems = await getNotificationsLast12h({
      viewerId,
      isVIP,
    })

    targetIds = visibleItems.map(item => item.id)
  } else {
    const visibleItems = await getNotificationsLast12h({
      viewerId,
      isVIP,
    })

    const visibleIdSet = new Set(
      visibleItems.map(item => item.id),
    )

    targetIds = targetIds.filter(id =>
      visibleIdSet.has(id),
    )
  }

  if (targetIds.length > 0) {
    await redis.sadd(readKey, ...targetIds)
    await redis.expire(readKey, 14 * 24 * 60 * 60)
  }

  return getUnreadCountLast12h({
    viewerId,
    isVIP,
  })
}

/* ============================= */
/* 🔥 NEW: delete one */
/* ============================= */
export async function deleteNotification(params: {
  viewerId: string
  id: string
}) {
  const { viewerId, id } = params

  await removeNotificationRowsByIds(
    viewerId,
    [id],
  )

  return { ok: true }
}

/* ============================= */
/* 🔥 NEW: delete all visible notifications */
/* ============================= */
export async function deleteAllNotifications(params: {
  viewerId: string
  isVIP: boolean
}) {
  const { viewerId } = params

  const rows =
    await getAllRawNotificationRows(
      viewerId,
    )

  const ids = rows
    .map(parseNotification)
    .filter((item): item is NotificationItem => item !== null)
    .map(item => item.id)

  await redis.del(
    getNotificationZSetKey(viewerId),
    getNotificationDedupeKey(viewerId),
    getReadSetKey(viewerId),
  )

  const shortDedupeKeys = ids.map(id =>
    getNotificationShortDedupeKey(
      viewerId,
      id,
    ),
  )

  if (shortDedupeKeys.length > 0) {
    await redis.del(...shortDedupeKeys)
  }

  return { ok: true, deletedCount: ids.length }
}
