import { saveRiskEvent } from '@/lib/vip/redis/saveRiskEvent'

type PositionGuide = {
  action: 'LONG' | 'SHORT' | 'WAIT'
  confidence: number // 0~1
  reason: string
}

/**
 * 포지션 가이드 계산
 *
 * 책임:
 * - HIGH 리스크 시 진입 제한 판단
 * - 🔒 EXTREME는 절대 여기서 저장하지 않음
 * - HIGH RiskEvent만 저장 (VIP 통계 보조 근거)
 */
export function calcPositionGuide(
  risk: 'LOW' | 'MEDIUM' | 'HIGH',
  pressure: number,
  params?: {
    entryPrice?: number
    worstPrice?: number
    position?: 'LONG' | 'SHORT'
    isExtreme?: boolean // 👈 EXTREME 여부 명시
  }
): PositionGuide {
  /**
   * 1️⃣ HIGH 리스크 → 진입 제한 확정
   */
  if (risk === 'HIGH') {
    /**
     * 🔥 HIGH RiskEvent 저장 조건
     * - EXTREME가 아닐 때만
     * - 가격 정보가 있을 때만
     */
    if (
      params?.isExtreme !== true &&
      params?.entryPrice !== undefined &&
      params?.worstPrice !== undefined
    ) {
      saveRiskEvent({
        riskLevel: 'HIGH',
        entryPrice: params.entryPrice,
        worstPrice: params.worstPrice,
        position: params.position ?? 'LONG',
        timestamp: Date.now(),
        reason: 'Entry blocked by risk engine',
      })
    }

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
