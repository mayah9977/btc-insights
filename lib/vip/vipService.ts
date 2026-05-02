import type { VIPLevel } from './vipTypes'
import {
  applyVIPPaymentSuccess,
  downgradeUserVIP,
  forceExpireVIP,
  getUserVIPState,
  recoverVIP,
} from './vipDB'
import { appendAudit } from './vipAuditStore'
import { pushVipUpdate } from './vipSSEHub'
import { notifyVipUpgrade } from './vipNotifier'

type GrantVIPInput = {
  userId: string
  expiredAt: number
  ref: string
  source: 'toss' | 'stripe' | 'manual'
}

type CancelVIPInput = {
  userId: string
  source: 'toss' | 'stripe' | 'manual'
  reason?: string
}

export async function grantVIP({
  userId,
  expiredAt,
  ref,
  source,
}: GrantVIPInput) {
  const prev = await getUserVIPState(userId)
  const before: VIPLevel = prev?.level ?? 'FREE'

  await applyVIPPaymentSuccess(userId, ref, expiredAt)

  appendAudit({
    userId,
    before,
    after: 'VIP',
    reason: 'PAYMENT',
    at: Date.now(),
  })

  pushVipUpdate(userId, {
    vipLevel: 'VIP',
  })

  await notifyVipUpgrade(userId, before, 'VIP')

  return {
    userId,
    before,
    after: 'VIP' as VIPLevel,
    expiredAt,
    ref,
    source,
  }
}

export async function cancelVIP({
  userId,
  source,
  reason,
}: CancelVIPInput) {
  const prev = await getUserVIPState(userId)
  if (!prev || prev.level === 'FREE') return null

  const before: VIPLevel = prev.level

  await downgradeUserVIP(userId)

  appendAudit({
    userId,
    before,
    after: 'FREE',
    reason: 'CANCEL',
    at: Date.now(),
  })

  pushVipUpdate(userId, {
    vipLevel: 'FREE',
  })

  return {
    userId,
    before,
    after: 'FREE' as VIPLevel,
    source,
    reason,
  }
}

export async function upgradeUserVip(
  userId: string,
  vipLevel: VIPLevel,
  days: number,
) {
  const prev = await getUserVIPState(userId)
  const before: VIPLevel = prev?.level ?? 'FREE'

  await recoverVIP(userId, vipLevel, days)

  appendAudit({
    userId,
    before,
    after: vipLevel,
    reason: 'PAYMENT',
    at: Date.now(),
  })

  pushVipUpdate(userId, {
    vipLevel,
  })

  await notifyVipUpgrade(userId, before, vipLevel)
}

export async function expireUserVip(userId: string) {
  const prev = await getUserVIPState(userId)
  if (!prev || prev.level === 'FREE') return

  const before: VIPLevel = prev.level

  await forceExpireVIP(userId)

  appendAudit({
    userId,
    before,
    after: 'FREE',
    reason: 'EXPIRE',
    at: Date.now(),
  })

  pushVipUpdate(userId, {
    vipLevel: 'FREE',
  })
}
