// lib/vip/vipTypes.ts

/** VIP 상품 레벨 */
export type VIPLevel = 'FREE' | 'VIP1' | 'VIP2' | 'VIP3';

/**
 * VIP Add-on 타입
 * - VIP 레벨과 독립
 * - 기간 기반 (expireAt timestamp)
 */
export type VIPAddon =
  | 'EXTREME_BOOST'
  | 'PRIORITY_STREAM'
  | 'ADVANCED_METRICS';
