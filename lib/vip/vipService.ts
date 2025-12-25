// lib/vip/vipService.ts
import type { VIPLevel } from './vipTypes';
import {
  saveUserVIP,
  getUserVIPState,
  forceExpireVIP,
} from './vipDB';
import { appendAudit } from './vipAuditStore';
import { pushVipUpdate } from './vipSseHub';
import { notifyVipUpgrade } from './vipNotifier';

/* =========================
 * 1️⃣ VIP 업그레이드 (Stripe)
 * ========================= */
export async function upgradeUserVip(
  userId: string,
  vipLevel: VIPLevel
) {
  const prev = await getUserVIPState(userId);
  const before: VIPLevel = prev?.level ?? 'FREE';

  // DB 저장 (결제 기준)
  await saveUserVIP(userId, vipLevel);

  // Audit
  appendAudit({
    userId,
    before,
    after: vipLevel,
    reason: 'PAYMENT',
    at: Date.now(),
  });

  // SSE
  pushVipUpdate(userId, {
    type: 'vip',
    vipLevel,
  });

  // Notification
  await notifyVipUpgrade(userId, before, vipLevel);

  console.log('[VIP] upgrade', userId, before, '→', vipLevel);
}

/* =========================
 * 2️⃣ VIP 최종 만료 (Cron)
 * ========================= */
export async function expireUserVip(userId: string) {
  const prev = await getUserVIPState(userId);
  if (!prev || prev.level === 'FREE') return;

  const before = prev.level;

  // DB
  await forceExpireVIP(userId);

  // Audit
  appendAudit({
    userId,
    before,
    after: 'FREE',
    reason: 'EXPIRE',
    at: Date.now(),
  });

  // SSE
  pushVipUpdate(userId, {
    type: 'vip',
    vipLevel: 'FREE',
  });

  console.log('[VIP] expired → FREE', userId);
}
