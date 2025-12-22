// lib/vip/vipRetention.ts
import { readUsageLogs } from './vipUsageLog';

export type VIPRetentionReason =
  | 'HIGH_USAGE'
  | 'CORE_FEATURE'
  | 'NO_REASON';

export function inferRetentionReason(
  userId: string
): VIPRetentionReason {
  const logs = readUsageLogs(userId, 100);

  const usageCount = logs.length;
  const extremeUsed = logs.some(
    (l) => l.event === 'EXTREME_MODE'
  );

  if (usageCount >= 20) return 'HIGH_USAGE';
  if (extremeUsed) return 'CORE_FEATURE';

  return 'NO_REASON';
}
