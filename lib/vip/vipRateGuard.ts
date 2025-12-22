// lib/vip/vipRateGuard.ts
import { getUserVIPLevel } from './vipServer';
import { VIP_USAGE_POLICY } from './vipUsagePolicy';

const apiCounter = new Map<string, { count: number; ts: number }>();

export async function checkRateLimit(userId: string) {
  const vip = await getUserVIPLevel(userId);
  const policy = VIP_USAGE_POLICY[vip];

  const now = Date.now();
  const slot = apiCounter.get(userId);

  if (!slot || now - slot.ts > 60_000) {
    apiCounter.set(userId, { count: 1, ts: now });
    return true;
  }

  if (slot.count >= policy.apiPerMinute) {
    return false;
  }

  slot.count++;
  return true;
}
