/*
=================================
VIP HISTORY STORE DISABLED
(legacy store - kept for reference)
=================================
*/

import { create } from 'zustand'

export type AvoidanceCase = {
  date: string
  market: string
  avoidedLossPercent: number
  reason: string
}

type VipHistoryState = {
  lossCases: AvoidanceCase[]
  todayAvoidedLossPercent?: number
  referenceSampleCount?: number
  hasTodayData: boolean
}

/*
  ⚠️ Legacy Store Disabled
  - 항상 빈 데이터 유지
  - 계산/업데이트 없음
  - 인터페이스만 유지 (import 안전)
*/

export const useVipHistoryStore = create<VipHistoryState>(() => ({
  lossCases: [],

  todayAvoidedLossPercent: undefined,
  referenceSampleCount: undefined,
  hasTodayData: false,
}))
