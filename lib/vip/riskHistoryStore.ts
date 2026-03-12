/*
=================================
VIP RISK HISTORY STORE DISABLED
(legacy store - kept for reference)
=================================
*/

import { create } from 'zustand'
import type { RiskLevel } from './riskTypes'

export type RiskHistoryItem = {
  time: string
  level: RiskLevel
  reason: string
}

export type RiskHistoryState = {
  history: RiskHistoryItem[]
  append: (item: RiskHistoryItem) => void
  reset: () => void
  hydrate: (items: RiskHistoryItem[]) => void
}

/*
  ⚠️ Legacy Store Disabled
  - state 업데이트 차단
  - 항상 빈 history 유지
*/

export const useVipRiskHistoryStore = create<RiskHistoryState>(() => ({
  history: [],

  append: () => {
    /* disabled */
  },

  reset: () => {
    /* disabled */
  },

  hydrate: () => {
    /* disabled */
  },
}))
