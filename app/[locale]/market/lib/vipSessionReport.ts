import { WhaleLog } from './whaleHistoryStore';

export function generateVIPSessionReport(logs: WhaleLog[]) {
  let high = 0;
  let medium = 0;
  let low = 0;

  for (const l of logs) {
    if (l.intensity === 'HIGH') high++;
    else if (l.intensity === 'MEDIUM') medium++;
    else low++;
  }

  const extreme = high >= 3;

  return {
    summary: extreme
      ? 'EXTREME 변동성 세션'
      : high >= 1
      ? '고변동성 세션'
      : '안정 세션',
    totalEvents: logs.length,
    breakdown: {
      high,
      medium,
      low,
    },
    extremeMode: extreme,
    generatedAt: new Date().toISOString(),
  };
}
