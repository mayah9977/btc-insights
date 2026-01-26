// lib/vip/vipService.ts
import type { VIPLevel } from './vipTypes'
import {
  recoverVIP,
  getUserVIPState,
  forceExpireVIP,
} from './vipDB'

import { appendAudit } from './vipAuditStore'
import { pushVipUpdate } from './vipSSEHub'
import { notifyVipUpgrade } from './vipNotifier'

/* =========================
 * 1️⃣ VIP 업그레이드 (Stripe / Admin)
 * ========================= */
export async function upgradeUserVip(
  userId: string,
  vipLevel: VIPLevel,
  days: number,
) {
  const prev = await getUserVIPState(userId)
  const before: VIPLevel = prev?.level ?? 'FREE'

  // ✅ VIP 부여 / 복구
  await recoverVIP(userId, vipLevel, days)

  // Audit
  appendAudit({
    userId,
    before,
    after: vipLevel,
    reason: 'PAYMENT',
    at: Date.now(),
  })

  // ✅ SSE (string SSOT)
  pushVipUpdate(userId, {
    vipLevel,
  })

  // Notification
  await notifyVipUpgrade(userId, before, vipLevel)

  console.log('[VIP] upgrade', userId, before, '→', vipLevel)
}

/* =========================
 * 2️⃣ VIP 최종 만료 (Cron)
 * ========================= */
export async function expireUserVip(userId: string) {
  const prev = await getUserVIPState(userId)
  if (!prev || prev.level === 'FREE') return

  const before: VIPLevel = prev.level

  // DB
  await forceExpireVIP(userId)

  // Audit
  appendAudit({
    userId,
    before,
    after: 'FREE',
    reason: 'EXPIRE',
    at: Date.now(),
  })

  // ✅ SSE (string SSOT)
  pushVipUpdate(userId, {
    vipLevel: 'FREE',
  })

  console.log('[VIP] expired → FREE', userId)
}
