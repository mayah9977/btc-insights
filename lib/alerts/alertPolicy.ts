import type { VIPLevel } from '../vip/vipTypes';

export const ALERT_LIMIT_BY_VIP: Record<VIPLevel, number> = {
  FREE: 3,
  VIP1: 10,
  VIP2: 30,
  VIP3: 100,
};

export function getAlertLimit(vip: VIPLevel): number {
  return ALERT_LIMIT_BY_VIP[vip] ?? 0;
}
