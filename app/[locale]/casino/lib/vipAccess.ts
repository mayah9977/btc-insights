// app/[locale]/casino/lib/vipAccess.ts

/**
 * VIP 등급 타입
 */
export type VIPLevel = 'FREE' | 'VIP1' | 'VIP2' | 'VIP3';

/**
 * VIP 산정 파라미터
 */
type Params = {
  hasPayment: boolean; // 결제 여부
  daysUsed: number;    // 사용 일수
  roi: number;         // 수익률 (%)
};

/**
 * VIP 레벨 계산 함수 (서버 전용)
 */
export function calcVIPLevel({
  hasPayment,
  daysUsed,
  roi,
}: Params): VIPLevel {
  if (!hasPayment) return 'FREE';

  if (daysUsed >= 30 && roi >= 20) return 'VIP3';
  if (daysUsed >= 14 && roi >= 10) return 'VIP2';

  return 'VIP1';
}
