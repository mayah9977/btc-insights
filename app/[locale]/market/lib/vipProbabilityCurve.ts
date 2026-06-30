export type VIPLevel = 'FREE' | 'VIP1' | 'VIP2' | 'VIP3';

/**
 * VIP 레벨별 실패 확률 곡선
 *
 * 핵심 개념:
 * - FREE  : 선형 (보정 없음)
 * - VIP1  : 약한 완화
 * - VIP2  : 중간 구간 리스크 압축
 * - VIP3  : 상단 꼬리(tail) 강력 압축
 */
export function getVipProbabilityCurve(
  baseProbability: number,
  vipLevel: VIPLevel
): number {
  let p = baseProbability;

  switch (vipLevel) {
    case 'VIP1':
      // 🔹 전체 리스크 약 10% 완화
      p *= 0.9;
      break;

    case 'VIP2':
      // 🔹 중간 리스크 구간 압축
      if (p > 0.4) {
        p = 0.4 + (p - 0.4) * 0.6;
      }
      break;

    case 'VIP3':
      // 🔥 상단 리스크 강력 압축 (EXTREME 보호)
      if (p > 0.35) {
        p = 0.35 + (p - 0.35) * 0.4;
      }
      break;

    case 'FREE':
    default:
      // 보정 없음
      break;
  }

  // 안전 클램프
  return Math.min(0.98, Math.max(0, p));
}
