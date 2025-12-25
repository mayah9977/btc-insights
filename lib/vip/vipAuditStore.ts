'use server';

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
 * 파일 기반 영구 저장 (DEV 전용)
 */
const DATA_DIR = path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'vip-audit.json');

async function ensure() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, '[]', 'utf-8');
  }
}

/**
 * Audit Log 추가
 */
export async function appendAudit(log: VIPAuditLog): Promise<void> {
  await ensure();

  const raw = fs.readFileSync(FILE, 'utf-8');
  const arr: VIPAuditLog[] = JSON.parse(raw);

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
export async function readAudits(
  limit = 200
): Promise<VIPAuditLog[]> {
  await ensure();

  const raw = fs.readFileSync(FILE, 'utf-8');
  const arr: VIPAuditLog[] = JSON.parse(raw);

  return arr.slice(0, limit);
}
