export type PositionGuide = {
  action: 'LONG' | 'SHORT' | 'WAIT'
  confidence: number // 0~1
  reason: string
}

/**
 * 포지션 가이드 계산 (PURE FUNCTION)
 *
 * 책임:
 * - 리스크 / 압력 기반 판단
 * - ❌ 저장 / Redis / Side-effect 없음
 * - Client / Server 공용 사용 가능
 */
export function calcPositionGuide(
  risk: 'LOW' | 'MEDIUM' | 'HIGH',
  pressure: number
): PositionGuide {
  /**
   * 1️⃣ HIGH 리스크 → 진입 제한
   */
  if (risk === 'HIGH') {
    return {
      action: 'SHORT',
      confidence: Math.min(1, pressure / 100),
      reason: 'High systemic risk detected',
    }
  }

  /**
   * 2️⃣ MEDIUM 리스크 → 대기
   */
  if (risk === 'MEDIUM') {
    return {
      action: 'WAIT',
      confidence: 0.5,
      reason: 'Unstable conditions, wait for confirmation',
    }
  }

  /**
   * 3️⃣ LOW 리스크 → 진입 허용
   */
  return {
    action: 'LONG',
    confidence: 0.6,
    reason: 'Market pressure is low and stable',
  }
}
