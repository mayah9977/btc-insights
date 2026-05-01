import type { VIPLevel, VIPAddon } from './vipTypes'
import { recordVIPChange } from './vipAuditLog'
import { pool } from '@/lib/db'

export type VIPState = {
  level: VIPLevel
  expiredAt: number
  graceUntil: number | null
  updatedAt: number
  priceId?: string
  addons?: {
    [key in VIPAddon]?: number
  }
}

type VIPUserRow = {
  user_id: string
  level: VIPLevel
  expired_at: string | number
  grace_until: string | number | null
  updated_at: string | number
  price_id: string | null
  addons: Record<string, number> | null
}

const GRACE_PERIOD_MS = 3 * 24 * 60 * 60 * 1000

function mapRow(row: VIPUserRow): VIPState {
  return {
    level: row.level,
    expiredAt: Number(row.expired_at),
    graceUntil:
      row.grace_until === null ? null : Number(row.grace_until),
    updatedAt: Number(row.updated_at),
    priceId: row.price_id ?? undefined,
    addons: (row.addons ?? {}) as {
      [key in VIPAddon]?: number
    },
  }
}

async function upsertVIP(
  userId: string,
  state: VIPState,
): Promise<void> {
  await pool.query(
    `
    INSERT INTO vip_users (
      user_id,
      level,
      expired_at,
      grace_until,
      updated_at,
      price_id,
      addons
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
    ON CONFLICT (user_id)
    DO UPDATE SET
      level = EXCLUDED.level,
      expired_at = EXCLUDED.expired_at,
      grace_until = EXCLUDED.grace_until,
      updated_at = EXCLUDED.updated_at,
      price_id = EXCLUDED.price_id,
      addons = EXCLUDED.addons
    `,
    [
      userId,
      state.level,
      state.expiredAt,
      state.graceUntil,
      state.updatedAt,
      state.priceId ?? null,
      JSON.stringify(state.addons ?? {}),
    ],
  )
}

export async function getUserVIPState(
  userId: string,
): Promise<VIPState | null> {
  const result = await pool.query<VIPUserRow>(
    `
    SELECT
      user_id,
      level,
      expired_at,
      grace_until,
      updated_at,
      price_id,
      addons
    FROM vip_users
    WHERE user_id = $1
    LIMIT 1
    `,
    [userId],
  )

  const row = result.rows[0]
  return row ? mapRow(row) : null
}

export async function isVIP(userId: string): Promise<boolean> {
  const vip = await getUserVIPState(userId)
  if (!vip) return false

  const now = Date.now()

  if (vip.level === 'VIP' && vip.expiredAt > now) return true
  if (vip.graceUntil && vip.graceUntil > now) return true

  return false
}

export async function setVIP(
  userId: string,
  days: number,
): Promise<void> {
  const now = Date.now()
  const prev = await getUserVIPState(userId)

  await upsertVIP(userId, {
    level: 'VIP',
    expiredAt: now + days * 86400000,
    graceUntil: null,
    updatedAt: now,
    priceId: prev?.priceId,
    addons: prev?.addons,
  })

  recordVIPChange({
    userId,
    before: prev?.level ?? 'FREE',
    after: 'VIP',
    reason: 'RECOVER',
    at: now,
  })
}

export async function applyVIPPaymentSuccess(
  userId: string,
  priceId: string,
  expiredAt: number,
): Promise<void> {
  const now = Date.now()
  const prev = await getUserVIPState(userId)

  await upsertVIP(userId, {
    level: 'VIP',
    priceId,
    expiredAt,
    graceUntil: null,
    updatedAt: now,
    addons: prev?.addons,
  })

  recordVIPChange({
    userId,
    before: prev?.level ?? 'FREE',
    after: 'VIP',
    reason: 'PAYMENT',
    at: now,
  })
}

export async function applyVIPPaymentSuccessByDays({
  userId,
  priceId,
  days,
}: {
  userId: string
  priceId: string
  days: number
}): Promise<void> {
  await applyVIPPaymentSuccess(
    userId,
    priceId,
    Date.now() + days * 86400000,
  )
}

export async function downgradeUserVIP(
  userId: string,
): Promise<void> {
  const prev = await getUserVIPState(userId)
  if (!prev) return

  const now = Date.now()

  await upsertVIP(userId, {
    ...prev,
    level: 'FREE',
    expiredAt: now,
    graceUntil: null,
    updatedAt: now,
  })

  recordVIPChange({
    userId,
    before: prev.level,
    after: 'FREE',
    reason: 'CANCEL',
    at: now,
  })
}

export async function applyGracePeriod(
  userId: string,
): Promise<void> {
  const prev = await getUserVIPState(userId)

  const now = Date.now()

  if (!prev) {
    await upsertVIP(userId, {
      level: 'FREE',
      expiredAt: now,
      graceUntil: now + GRACE_PERIOD_MS,
      updatedAt: now,
      addons: {},
    })

    return
  }

  await upsertVIP(userId, {
    ...prev,
    graceUntil: now + GRACE_PERIOD_MS,
    updatedAt: now,
  })

  recordVIPChange({
    userId,
    before: prev.level,
    after: prev.level,
    reason: 'GRACE',
    at: now,
  })
}

export async function forceExpireVIP(userId: string): Promise<void> {
  const prev = await getUserVIPState(userId)
  if (!prev) return

  const now = Date.now()

  await upsertVIP(userId, {
    ...prev,
    level: 'FREE',
    expiredAt: now,
    graceUntil: null,
    updatedAt: now,
  })

  recordVIPChange({
    userId,
    before: prev.level,
    after: 'FREE',
    reason: 'EXPIRE',
    at: now,
  })
}

export async function expireOverdueVIPs(): Promise<number> {
  const now = Date.now()

  const result = await pool.query<{ user_id: string }>(
    `
    UPDATE vip_users
    SET
      level = 'FREE',
      updated_at = $1
    WHERE
      level = 'VIP'
      AND expired_at <= $1
      AND (grace_until IS NULL OR grace_until <= $1)
    RETURNING user_id
    `,
    [now],
  )

  for (const row of result.rows) {
    recordVIPChange({
      userId: row.user_id,
      before: 'VIP',
      after: 'FREE',
      reason: 'EXPIRE',
      at: now,
    })
  }

  return result.rowCount ?? 0
}

export async function extendVIP(
  userId: string,
  days: number,
): Promise<void> {
  const prev = await getUserVIPState(userId)
  if (!prev) return

  const now = Date.now()

  const base = Math.max(prev.expiredAt, now)

  await upsertVIP(userId, {
    ...prev,
    level: 'VIP',
    expiredAt: base + days * 86400000,
    graceUntil: null,
    updatedAt: now,
  })

  recordVIPChange({
    userId,
    before: prev.level,
    after: 'VIP',
    reason: 'EXTEND',
    at: now,
  })
}

export async function recoverVIP(
  userId: string,
  level: VIPLevel,
  days: number,
): Promise<void> {
  const now = Date.now()
  const prev = await getUserVIPState(userId)

  await upsertVIP(userId, {
    level,
    expiredAt: now + days * 86400000,
    graceUntil: null,
    updatedAt: now,
    addons: prev?.addons,
  })

  recordVIPChange({
    userId,
    before: prev?.level ?? 'FREE',
    after: level,
    reason: 'RECOVER',
    at: now,
  })
}
