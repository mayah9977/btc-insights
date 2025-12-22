import { readUsageLogs } from './vipUsageLog';
import { inferRetentionReason } from './vipRetention';

export type PriceIncreaseSignal =
  | 'SAFE'
  | 'RISKY'
  | 'DO_NOT_INCREASE';

export function analyzePriceIncreaseTiming(
  userId: string
): PriceIncreaseSignal {
  const usage = readUsageLogs(userId, 100);
  const retention = inferRetentionReason(userId);

  if (retention === 'HIGH_USAGE' && usage.length >= 30) {
    return 'SAFE';
  }

  if (usage.length >= 10) {
    return 'RISKY';
  }

  return 'DO_NOT_INCREASE';
}
