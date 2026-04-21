import { redis } from '@/lib/redis'

export type NotificationType = 'NOTICE' | 'BTC_ALERT' | 'INDICATOR'

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

const NOTIFICATION_ZSET_KEY = 'notification:list'
const NOTIFICATION_DEDUPE_KEY = 'notification:dedupe'

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

/* ============================= */
/* 기존 저장 로직 유지 */
/* ============================= */
export async function saveNotification(notification: NotificationItem) {
  const isDuplicate = await redis.sismember(
    NOTIFICATION_DEDUPE_KEY,
    notification.id,
  )

  if (isDuplicate) return

  await redis.sadd(NOTIFICATION_DEDUPE_KEY, notification.id)
  await redis.expire(NOTIFICATION_DEDUPE_KEY, 12 * 60 * 60)

  await redis.zadd(
    NOTIFICATION_ZSET_KEY,
    notification.createdAt,
    JSON.stringify(notification),
  )

  const olderThan = Date.now() - 24 * 60 * 60 * 1000
  await redis.zremrangebyscore(
    NOTIFICATION_ZSET_KEY,
    '-inf',
    olderThan,
  )
}

/* ============================= */
/* 기존 12시간 조회 */
/* ============================= */
export async function getRawNotificationsLast12h() {
  const now = Date.now()
  const twelveHoursAgo = now - 12 * 60 * 60 * 1000

  const rows = await redis.zrevrangebyscore(
    NOTIFICATION_ZSET_KEY,
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

  const rawItems = await getRawNotificationsLast12h()
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
/* 🔥 NEW: NOTICE 전용 전체 조회 */
/* ============================= */
export async function getNoticeNotifications(params: {
  viewerId: string
  isVIP: boolean
}) {
  const { viewerId, isVIP } = params

  // 🔥 전체 24시간 범위 (현재 저장 구조 기준)
  const rows = await redis.zrevrange(
    NOTIFICATION_ZSET_KEY,
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
/* 기존 read 처리 유지 */
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
