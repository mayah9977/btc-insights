// lib/vip/vipAuditStore.ts
import fs from 'fs';
import path from 'path';
import { VIPLevel } from './vipTypes';

/**
 * VIP Audit Reason (SSOT)
 */
export type VIPAuditReason =
  | 'ADMIN'
  | 'PAYMENT'
  | 'CANCEL'
  | 'EXPIRE'
  | 'EXTEND'
  | 'ABUSE'
  | 'RECOVER';

/**
 * VIP Audit Log 타입
 */
export type VIPAuditLog = {
  userId: string;
  before: VIPLevel;
  after: VIPLevel;
  reason: VIPAuditReason;
  at: number;
};

/**
 * 파일 기반 영구 저장 (DEV)
 */
const DATA_DIR = path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'vip-audit.json');

function ensure() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
  }
  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, '[]', 'utf-8');
  }
}

/**
 * Audit Log 추가
 */
export function appendAudit(log: VIPAuditLog) {
  ensure();
  const arr: VIPAuditLog[] = JSON.parse(
    fs.readFileSync(FILE, 'utf-8')
  );
  arr.unshift(log);
  fs.writeFileSync(
    FILE,
    JSON.stringify(arr, null, 2),
    'utf-8'
  );
}

/**
 * Audit Log 조회
 */
export function readAudits(limit = 200): VIPAuditLog[] {
  ensure();
  const arr: VIPAuditLog[] = JSON.parse(
    fs.readFileSync(FILE, 'utf-8')
  );
  return arr.slice(0, limit);
}
