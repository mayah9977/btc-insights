// lib/vip/vipPolicy.ts
import { VIPLevel } from './vipTypes';

const ORDER: VIPLevel[] = ['FREE', 'VIP1', 'VIP2', 'VIP3'];

export function hasVipAccess(
  user: VIPLevel,
  required: VIPLevel
): boolean {
  return ORDER.indexOf(user) >= ORDER.indexOf(required);
}
