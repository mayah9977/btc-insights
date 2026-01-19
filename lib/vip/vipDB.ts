// lib/vip/vipDB.ts
import type { VIPLevel, VIPAddon } from './vipTypes'
import { recordVIPChange } from './vipAuditLog'

export type VIPState = {
  level: VIPLevel
  expiredAt: number
  updatedAt: number
  priceId?: string
  addons?: {
    [key in VIPAddon]?: number
  }
}

/**
 * DEV in-memory DB
 * ⚠️ 실서비스에서는 Redis / DB로 교체
 */
const mem = new Map<string, VIPState>()
const autoExtendOption = new Map<string, number>()

/* =========================
   Price → VIP Level / Period
========================= */
function priceIdToVIP(priceId: string): {
  level: VIPLevel
  days: number
} {
  if (priceId === process.env.STRIPE_PRICE_VIP3)
    return { level: 'VIP3', days: 30 }

  if (priceId === process.env.STRIPE_PRICE_VIP2)
    return { level: 'VIP2', days: 30 }

  if (priceId === process.env.STRIPE_PRICE_VIP1)
    return { level: 'VIP1', days: 30 }

  return { level: 'VIP1', days: 30 }
}

/* =========================
   Read
========================= */
export async function getUserVIPState(
  userId: string
): Promise<VIPState | null> {
  return mem.get(userId) ?? null
}

/* =========================
   Write (결제 성공 SSOT)
========================= */
export async function applyVIPPaymentSuccess(
  userId: string,
  priceId: string
) {
  const now = Date.now()
  const { level, days } = priceIdToVIP(priceId)
  const prev = mem.get(userId)

  mem.set(userId, {
    level,
    priceId,
    expiredAt: now + days * 86400000,
    updatedAt: now,
    addons: prev?.addons,
  })

  recordVIPChange({
    userId,
    before: prev?.level ?? 'FREE',
    after: level,
    reason: 'PAYMENT',
    at: now,
  })
}

/* =========================
   Downgrade / Expire
========================= */
export async function downgradeUserVIP(userId: string) {
  const prev = mem.get(userId)
  if (!prev) return

  const now = Date.now()
  mem.set(userId, { ...prev, expiredAt: now, updatedAt: now })

  recordVIPChange({
    userId,
    before: prev.level,
    after: prev.level,
    reason: 'CANCEL',
    at: now,
  })
}

export async function forceExpireVIP(userId: string) {
  const prev = mem.get(userId)
  if (!prev) return

  const now = Date.now()
  mem.set(userId, { ...prev, expiredAt: now, updatedAt: now })

  recordVIPChange({
    userId,
    before: prev.level,
    after: prev.level,
    reason: 'EXPIRE',
    at: now,
  })
}

/* =========================
   Extend / Recover
========================= */
export async function extendVIP(userId: string, days: number) {
  const prev = mem.get(userId)
  if (!prev) return

  const now = Date.now()
  mem.set(userId, {
    ...prev,
    expiredAt: prev.expiredAt + days * 86400000,
    updatedAt: now,
  })

  recordVIPChange({
    userId,
    before: prev.level,
    after: prev.level,
    reason: 'EXTEND',
    at: now,
  })
}

export async function recoverVIP(
  userId: string,
  level: VIPLevel,
  days: number
) {
  const now = Date.now()
  const prev = mem.get(userId)

  mem.set(userId, {
    level,
    expiredAt: now + days * 86400000,
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

/* =========================
   Auto Extend
========================= */
export async function enableAutoExtend(userId: string, days: number) {
  autoExtendOption.set(userId, days)
}

export async function applyAutoExtendIfEnabled(userId: string) {
  const days = autoExtendOption.get(userId)
  if (days) await extendVIP(userId, days)
}
