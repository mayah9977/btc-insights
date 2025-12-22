// lib/vip/vipAuditLog.ts
import { VIPLevel } from './vipTypes';

export type VIPAuditReason =
  | 'ADMIN'
  | 'PAYMENT'
  | 'CANCEL'
  | 'EXPIRE'
  | 'EXTEND'
  | 'ABUSE'
  | 'RECOVER';

export type VIPAuditLog = {
  userId: string;
  before: VIPLevel;
  after: VIPLevel;
  reason: VIPAuditReason;
  at: number;
};

const logs: VIPAuditLog[] = [];

export function recordVIPChange(log: VIPAuditLog) {
  logs.unshift(log);
}

export function getVIPAuditLogs() {
  return logs;
}
