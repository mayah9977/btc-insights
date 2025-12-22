import type { VIPLevel } from './vipAccess';

// ⚠️ TODO: Redis / DB로 교체 가능
const extremeState = new Map<
  string,
  { active: boolean; until: number }
>();

const EXTREME_DURATION_MS = 5 * 60 * 1000; // 5분
const EXTREME_COOLDOWN_MS = 10 * 60 * 1000; // 10분

export function activateExtreme(
  userId: string,
  vipLevel: VIPLevel
) {
  if (vipLevel !== 'VIP3') return;

  const now = Date.now();
  extremeState.set(userId, {
    active: true,
    until: now + EXTREME_DURATION_MS,
  });
}

export function isExtremeActive(userId: string): boolean {
  const state = extremeState.get(userId);
  if (!state) return false;

  if (Date.now() > state.until) {
    extremeState.delete(userId);
    return false;
  }
  return state.active;
}
