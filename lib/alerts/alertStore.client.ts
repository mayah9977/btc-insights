/* =====================================================
 * ⚠️ CLIENT ONLY
 * - 서버 상태를 절대 변경하지 않음
 * - UI 파생 상태 계산 전용
 * ===================================================== */

import type { PriceAlert } from './alertTypes'

/* =========================
 * UI Status (Derived Only)
 * ❗ 서버에 저장 금지
 * ========================= */
export type AlertUIStatus =
  | 'WAITING'
  | 'COOLDOWN'
  | 'TRIGGERED'
  | 'DISABLED'

/* =========================
 * Status Resolver (UI 전용)
 * ✅ SSOT = alert.status
 * ========================= */
export function getAlertStatus(
  alert: PriceAlert,
): AlertUIStatus {
  // 1️⃣ 서버에서 비활성화된 상태
  if (alert.status === 'DISABLED') {
    return 'DISABLED'
  }

  // 2️⃣ 1회성 알림 완료
  if (alert.status === 'TRIGGERED') {
    return 'TRIGGERED'
  }

  // 3️⃣ 반복 알림 + 쿨다운 중
  if (
    alert.repeatMode === 'REPEAT' &&
    alert.cooldownMs &&
    alert.lastTriggeredAt &&
    Date.now() - alert.lastTriggeredAt < alert.cooldownMs
  ) {
    return 'COOLDOWN'
  }

  // 4️⃣ 기본 대기
  return 'WAITING'
}

/* =========================
 * UI Helper
 * ========================= */

/**
 * 알림 우선순위
 * - 리스트 정렬 / 강조도 계산용
 */
export function getAlertPriority(
  alert: PriceAlert,
): number {
  switch (getAlertStatus(alert)) {
    case 'WAITING':
      return 3
    case 'COOLDOWN':
      return 2
    case 'TRIGGERED':
      return 1
    case 'DISABLED':
      return 0
    default:
      return 0
  }
}

/**
 * 비활성 알림 여부
 * - 리스트 숨김 / 밀도 조절용
 */
export function isInactiveAlert(
  alert: PriceAlert,
): boolean {
  const status = getAlertStatus(alert)
  return status === 'DISABLED' || status === 'TRIGGERED'
}
