import { create } from 'zustand'

export type AvoidanceCase = {
  date: string
  market: string
  avoidedLossPercent: number
  reason: string
}

type VipHistoryState = {
  /** 원본 히스토리 (SSOT) */
  lossCases: AvoidanceCase[]

  /** Phase 2-⑤ 요약용 필드 */
  todayAvoidedLossPercent?: number
  referenceSampleCount?: number
  hasTodayData: boolean
}

/**
 * VIP History Store (SSOT)
 * - 계산 ❌
 * - 판단 ❌
 * - 이미 확정된 "손실 회피 결과"만 보관
 * - UI는 이 값을 그대로 소비
 */
export const useVipHistoryStore = create<VipHistoryState>(() => ({
  lossCases: [
    {
      date: '2025-01-02',
      market: 'BTCUSDT',
      avoidedLossPercent: 6.4,
      reason: 'Extreme 변동성 + 고래 불균형',
    },
  ],

  /** ===== Phase 2-⑤ (오늘 기준 요약) ===== */
  todayAvoidedLossPercent: 6.4,
  referenceSampleCount: 18,
  hasTodayData: true,
}))
