import type { VIPLevel } from './vipTypes'

/**
 * VIP 등급 우선순위 (SSOT)
 */
export const VIP_ORDER: VIPLevel[] = [
  'FREE',
  'VIP',
]

/**
 * 🔐 VIP 접근 권한 체크
 * user >= required
 */
export function hasVipAccess(
  user: VIPLevel,
  required: VIPLevel
): boolean {
  return (
    VIP_ORDER.indexOf(user) >=
    VIP_ORDER.indexOf(required)
  )
}

/**
 * 🔔 VIP 등급별 알림 생성 최대 개수
 */
export function getMaxAlertsByVip(
  level: VIPLevel
): number {
  switch (level) {
    case 'VIP':
      return 100
    default:
      return 3 // FREE
  }
}
