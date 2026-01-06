// lib/vip/vipAuditLog.ts
import { VIPLevel } from './vipTypes'

export type VIPAuditReason =
  | 'ADMIN'
  | 'PAYMENT'
  | 'CANCEL'
  | 'EXPIRE'
  | 'EXTEND'
  | 'ABUSE'
  | 'RECOVER'

export type VIPAuditLog = {
  userId: string
  before: VIPLevel
  after: VIPLevel
  reason: VIPAuditReason
  at: number
}

const MAX_LOG = 500
const logs: VIPAuditLog[] = []

export function recordVIPChange(log: VIPAuditLog) {
  logs.unshift(log)
  if (logs.length > MAX_LOG) logs.pop()
}

export function getVIPAuditLogs(limit = 100): VIPAuditLog[] {
  return logs.slice(0, limit)
}
