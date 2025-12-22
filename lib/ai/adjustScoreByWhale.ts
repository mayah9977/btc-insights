import type { WhaleIntensity } from "./calcWhaleIntensity";

/**
 * Whale 빈도 + 강도 기반 AI Score 보정
 */
export function adjustScoreByWhale(params: {
  baseScore: number;
  whaleCount: number;        // 최근 N분 고래 횟수
  intensity: WhaleIntensity;
}): number {
  const { baseScore, whaleCount, intensity } = params;

  let score = baseScore;

  // 📉 빈도 패널티
  if (whaleCount >= 3) score -= 5;
  if (whaleCount >= 6) score -= 10;

  // 📈 강도 보너스 / 패널티
  if (intensity === "HIGH") score += 3;
  if (intensity === "LOW") score -= 2;

  return Math.max(0, Math.min(100, score));
}
