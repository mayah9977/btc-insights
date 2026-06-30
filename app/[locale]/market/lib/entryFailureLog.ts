export type EntryFailureLog = {
  ts: number;
  aiScore: number;
  whaleWeight: number;
  vipLevel: "FREE" | "VIP1" | "VIP2" | "VIP3";
  reason: "LOW_SCORE" | "WHALE_OVERHEAT" | "PROBABILITY_FAIL";
};

const logs: EntryFailureLog[] = [];

export function recordEntryFailure(log: EntryFailureLog) {
  logs.push(log);

  // 메모리 상한 (최근 500개)
  if (logs.length > 500) {
    logs.shift();
  }
}

export function getEntryFailureLogs() {
  return logs;
}
