// lib/vip/vipGrace.ts
import { VIPLevel } from './vipTypes';

export type VIPStateLike = {
  level: VIPLevel;
  expiredAt: number;
};

// ⏱ Grace Period: 3일
const GRACE_PERIOD_MS = 1000 * 60 * 60 * 24 * 3;

/**
 * Grace Period 판별
 */
export function isVIPInGracePeriod(state: VIPStateLike): boolean {
  const now = Date.now();
  return (
    now >= state.expiredAt &&
    now < state.expiredAt + GRACE_PERIOD_MS
  );
}

/**
 * Grace 포함 VIP 해석
 */
export function resolveVIPWithGrace(
  state: VIPStateLike
): VIPLevel {
  const now = Date.now();

  if (now < state.expiredAt) return state.level;
  if (isVIPInGracePeriod(state)) return state.level;

  return 'FREE';
}
