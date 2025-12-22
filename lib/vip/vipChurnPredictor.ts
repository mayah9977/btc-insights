import { readUsageLogs } from './vipUsageLog';

export type ChurnRisk = 'LOW' | 'MEDIUM' | 'HIGH';

export function predictVIP3Churn(userId: string): ChurnRisk {
  const logs = readUsageLogs(userId, 30);

  if (logs.length === 0) return 'HIGH';
  if (logs.length < 5) return 'MEDIUM';

  return 'LOW';
}
