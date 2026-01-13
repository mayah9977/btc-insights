import { create } from 'zustand'

export type AvoidanceCase = {
  date: string
  market: string
  avoidedLossPercent: number
  reason: string
}

type VipHistoryState = {
  lossCases: AvoidanceCase[]
}

/**
 * VIP History Store (SSOT)
 * - 계산 ❌
 * - 판단 ❌
 * - VIP 손실 회피 결과만 보관
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
}))
