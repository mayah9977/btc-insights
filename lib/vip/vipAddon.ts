// lib/vip/vipAddon.ts
import { getUserVIPState } from './vipDB';
import { VIPAddon } from './vipTypes';
import { appendAudit } from './vipAuditStore';

export async function enableVIPAddon(
  userId: string,
  addon: VIPAddon,
  days: number,
  reason: 'PAYMENT' | 'ADMIN'
) {
  const vip = await getUserVIPState(userId);
  if (!vip) return;

  const expireAt = Date.now() + days * 86400000;

  vip.addons = {
    ...(vip.addons ?? {}),
    [addon]: expireAt,
  };

  appendAudit({
    userId,
    before: vip.level,
    after: vip.level,
    reason,
    at: Date.now(),
  });
}

export function hasVIPAddon(
  addons: any,
  addon: VIPAddon
) {
  const exp = addons?.[addon];
  return typeof exp === 'number' && exp > Date.now();
}
