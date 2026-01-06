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

// DEV in-memory DB
const mem = new Map<string, VIPState>()
const autoExtendOption = new Map<string, number>()

function priceIdToLevel(priceId: string): VIPLevel {
  if (priceId === process.env.STRIPE_PRICE_VIP3) return 'VIP3'
  if (priceId === process.env.STRIPE_PRICE_VIP2) return 'VIP2'
  if (priceId === process.env.STRIPE_PRICE_VIP1) return 'VIP1'
  return 'VIP1'
}

export async function getUserVIPState(
  userId: string
): Promise<VIPState | null> {
  return mem.get(userId) ?? null
}

export async function saveUserVIP(userId: string, priceId: string) {
  const now = Date.now()
  const level = priceIdToLevel(priceId)
  const prev = mem.get(userId)

  mem.set(userId, {
    level,
    priceId,
    expiredAt: now + 30 * 86400000,
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

/* Auto Extend */
export async function enableAutoExtend(userId: string, days: number) {
  autoExtendOption.set(userId, days)
}

export async function applyAutoExtendIfEnabled(userId: string) {
  const days = autoExtendOption.get(userId)
  if (days) await extendVIP(userId, days)
}
