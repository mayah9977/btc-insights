// lib/vip/vipGrace.ts
import { VIPLevel } from './vipTypes';

type VIPState = {
  level: VIPLevel;
  expiredAt: number; // timestamp (ms)
};

// ⏱ VIP 만료 후 유예 기간 (3일)
const GRACE_PERIOD_MS = 1000 * 60 * 60 * 24 * 3;

export function resolveVIPWithGrace(
  state: VIPState
): VIPLevel {
  const now = Date.now();

  // ✅ 아직 만료 안 됨
  if (now < state.expiredAt) {
    return state.level;
  }

  // ⚠️ 만료되었지만 Grace Period 안
  if (now < state.expiredAt + GRACE_PERIOD_MS) {
    return state.level;
  }

  // ❌ 완전 만료
  return 'FREE';
}
