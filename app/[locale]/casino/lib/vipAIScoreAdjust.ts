import type { VIPLevel } from './vipProbabilityCurve';

/**
 * Whale / Extreme 상황에서
 * VIP 레벨별 AI Score 보정
 */
export function adjustAIScoreByVIP(
  baseScore: number,
  vipLevel: VIPLevel,
  whalePressure: number // 0~1
): number {
  const k =
    vipLevel === 'VIP3'
      ? 0.4
      : vipLevel === 'VIP2'
      ? 0.6
      : vipLevel === 'VIP1'
      ? 0.8
      : 1.0;

  const adjusted = baseScore - whalePressure * 100 * k;
  return Math.max(0, Math.min(100, adjusted));
}
