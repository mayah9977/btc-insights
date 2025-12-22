// lib/vip/vipAIChurnModel.ts
import { readUsageLogs } from './vipUsageLog';

export type AIChurnScore = {
  score: number; // 0 ~ 1
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
};

export function predictChurnWithAI(
  userId: string
): AIChurnScore {
  const usage = readUsageLogs(userId, 30);

  let score = 0.5;

  if (usage.length === 0) score += 0.4;
  if (usage.length < 5) score += 0.2;
  if (usage.length > 20) score -= 0.3;

  score = Math.max(0, Math.min(1, score));

  const risk =
    score > 0.7 ? 'HIGH' :
    score > 0.4 ? 'MEDIUM' :
    'LOW';

  return { score, risk };
}
