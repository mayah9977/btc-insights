// lib/alerts/alertLimit.ts
import { getUserVIPState } from '../vip/vipDB';

const LIMIT: Record<string, number> = {
  FREE: 3,
  VIP1: 10,
  VIP2: 30,
  VIP3: Infinity,
};

export async function canCreateAlert(
  userId: string,
  currentCount: number
) {
  const vip = await getUserVIPState(userId);
  const level = vip?.level ?? 'FREE';

  return currentCount < LIMIT[level];
}
