import type { VIPLevel } from './vipProbabilityCurve';

/**
 * VIP 레벨별 Danger Zone 진입 임계값
 * 값 ↑ = 더 위험해야 진입
 */
export function getDangerThreshold(vipLevel: VIPLevel): number {
  switch (vipLevel) {
    case 'VIP3':
      return 0.75;
    case 'VIP2':
      return 0.7;
    case 'VIP1':
      return 0.65;
    default:
      return 0.6;
  }
}
