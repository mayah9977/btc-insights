/**
 * VIP Risk Level (SSOT)
 *
 * ⚠️ 주의
 * - 리스크 단계의 단일 기준 타입
 * - store / hook / UI 어디에서도 재정의 ❌
 * - 반드시 여기서만 import 해서 사용
 */

export type RiskLevel =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'EXTREME'
