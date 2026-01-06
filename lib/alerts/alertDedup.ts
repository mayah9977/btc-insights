// lib/alerts/alertDedup.ts
const firedMap = new Map<string, number>();

const COOLDOWN_MS = 60_000; // 1분

export function canFire(alertId: string): boolean {
  const now = Date.now();
  const last = firedMap.get(alertId);

  if (last && now - last < COOLDOWN_MS) {
    return false;
  }

  firedMap.set(alertId, now);
  return true;
}
