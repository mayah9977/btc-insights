import type { VIPLevel } from './vipProbabilityCurve';

type UserStats = {
  paid: boolean;
  usageDays: number; // 사용 기간 (일)
  roi: number; // 누적 수익률 (%)
};

export function resolveVIPLevel({
  paid,
  usageDays,
  roi,
}: UserStats): VIPLevel {
  if (paid && usageDays >= 90 && roi >= 30) return 'VIP3';
  if (paid && usageDays >= 30 && roi >= 10) return 'VIP2';
  if (paid) return 'VIP1';
  return 'FREE';
}
