// lib/vip/vipUsageLog.ts
import fs from 'fs';
import path from 'path';

export type VIPUsageEvent =
  | 'VIP3_SSE'
  | 'VIP3_WS'
  | 'EXTREME_MODE'
  | 'BACKTEST'
  | 'WHALE_HEATMAP';

export type VIPUsageLog = {
  userId: string;
  event: VIPUsageEvent;
  at: number;
};

const FILE = path.join(process.cwd(), 'data', 'vip-usage.json');

function ensure() {
  if (!fs.existsSync(path.dirname(FILE))) {
    fs.mkdirSync(path.dirname(FILE));
  }
  if (!fs.existsSync(FILE)) {
    fs.writeFileSync(FILE, '[]', 'utf-8');
  }
}

export function recordUsage(
  userId: string,
  event: VIPUsageEvent
) {
  ensure();
  const arr: VIPUsageLog[] = JSON.parse(
    fs.readFileSync(FILE, 'utf-8')
  );
  arr.unshift({ userId, event, at: Date.now() });
  fs.writeFileSync(FILE, JSON.stringify(arr, null, 2));
}

export function readUsageLogs(
  userId: string,
  limit = 200
) {
  ensure();
  const arr: VIPUsageLog[] = JSON.parse(
    fs.readFileSync(FILE, 'utf-8')
  );
  return arr.filter((l) => l.userId === userId).slice(0, limit);
}
