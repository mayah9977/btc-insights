// lib/vip/vipChurn.ts
import fs from 'fs';
import path from 'path';

export type VIPChurnReason =
  | 'PRICE'
  | 'LOW_USAGE'
  | 'ABUSE_BLOCK'
  | 'MANUAL_CANCEL'
  | 'UNKNOWN';

export type VIPChurnLog = {
  userId: string;
  reason: VIPChurnReason;
  at: number;
};

const FILE = path.join(process.cwd(), 'data', 'vip-churn.json');

function ensure() {
  if (!fs.existsSync(path.dirname(FILE))) {
    fs.mkdirSync(path.dirname(FILE));
  }
  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, '[]', 'utf-8');
  }
}

export function recordChurn(
  userId: string,
  reason: VIPChurnReason
) {
  ensure();
  const arr: VIPChurnLog[] = JSON.parse(
    fs.readFileSync(FILE, 'utf-8')
  );
  arr.unshift({ userId, reason, at: Date.now() });
  fs.writeFileSync(FILE, JSON.stringify(arr, null, 2));
}

export function readChurnLogs(limit = 200) {
  ensure();
  const arr: VIPChurnLog[] = JSON.parse(
    fs.readFileSync(FILE, 'utf-8')
  );
  return arr.slice(0, limit);
}
