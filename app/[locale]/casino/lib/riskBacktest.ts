import { DangerLog } from './dangerZoneLogStore';

type Result = {
  bucket: string;
  count: number;
  estimatedWinRate: number;
};

export function backtestRiskWinRate(
  logs: DangerLog[]
): Result[] {
  const buckets = [
    { name: '<40%', min: 0, max: 0.4 },
    { name: '40~60%', min: 0.4, max: 0.6 },
    { name: '60~80%', min: 0.6, max: 0.8 },
    { name: '80%+', min: 0.8, max: 1 },
  ];

  return buckets.map((b) => {
    const slice = logs.filter(
      (l) => l.probability >= b.min && l.probability < b.max
    );

    // 가상 승률 모델 (Risk 높을수록 승률 하락)
    const avgRisk =
      slice.reduce((s, l) => s + l.probability, 0) /
      (slice.length || 1);

    return {
      bucket: b.name,
      count: slice.length,
      estimatedWinRate: Math.max(0, 1 - avgRisk),
    };
  });
}
