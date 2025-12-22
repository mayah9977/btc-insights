type StableLog = {
  at: number;
  avgReliability: number;
};

const logs: StableLog[] = [];
let inStableZone = false;

export function checkAndLogStableZone(
  avgReliability: number,
  threshold = 0.35
) {
  if (!inStableZone && avgReliability < threshold) {
    logs.unshift({
      at: Date.now(),
      avgReliability,
    });
    inStableZone = true;
  }

  if (inStableZone && avgReliability >= threshold) {
    inStableZone = false;
  }
}

export function getStableZoneLogs() {
  return logs;
}
