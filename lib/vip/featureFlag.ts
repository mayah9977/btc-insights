// lib/vip/featureFlag.ts
import { VIPLevel } from './vipTypes';

export function hasVIP3Feature(vip: VIPLevel): boolean {
  return vip === 'VIP3';
}
