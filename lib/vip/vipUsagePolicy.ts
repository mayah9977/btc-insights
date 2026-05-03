import type { VIPLevel } from './vipTypes'

export const VIP_USAGE_POLICY: Record<
  VIPLevel,
  {
    apiPerMinute: number
    sseConnections: number
  }
> = {
  FREE: { apiPerMinute: 10, sseConnections: 0 },
  VIP: { apiPerMinute: 300, sseConnections: 2 },
}
