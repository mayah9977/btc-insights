// lib/vip/vipUsagePolicy.ts
import { VIPLevel } from './vipTypes';

export const VIP_USAGE_POLICY: Record<
  VIPLevel,
  {
    apiPerMinute: number;
    sseConnections: number;
  }
> = {
  FREE: { apiPerMinute: 10, sseConnections: 0 },
  VIP1: { apiPerMinute: 60, sseConnections: 0 },
  VIP2: { apiPerMinute: 120, sseConnections: 1 },
  VIP3: { apiPerMinute: 300, sseConnections: 2 },
};
