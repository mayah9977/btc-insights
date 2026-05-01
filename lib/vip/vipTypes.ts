// lib/vip/vipTypes.ts
export type VIPLevel = 'FREE' | 'VIP'

export type VIPAddon =
  | 'EXTREME_BOOST'
  | 'PRIORITY_STREAM'
  | 'ADVANCED_METRICS'

export type VIPAuditReason =
  | 'ADMIN'
  | 'PAYMENT'
  | 'CANCEL'
  | 'EXPIRE'
  | 'EXTEND'
  | 'ABUSE'
  | 'RECOVER'
  | 'GRACE'
  