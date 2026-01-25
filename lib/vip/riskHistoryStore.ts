// lib/vip/riskHistoryStore.ts
import { create } from 'zustand'
import type { RiskLevel } from './riskTypes'

export type RiskHistoryItem = {
  time: string
  level: RiskLevel
  reason: string
}

export type RiskHistoryState = {
  /** 과거 + 실시간 Risk 히스토리 */
  history: RiskHistoryItem[]

  /** 실시간 Risk 이벤트 누적 */
  append: (item: RiskHistoryItem) => void

  /** 전체 초기화 (로그아웃 / 세션 변경 등) */
  reset: () => void

  /** 🔥 최초 1회 과거 히스토리 주입 (SSR ❌ / Client only) */
  hydrate: (items: RiskHistoryItem[]) => void
}

/**
 * ⚠️ SSOT: VIP Risk History 단일 소스
 * - 계산 ❌
 * - 해석 ❌
 * - UI ❌
 * - 과거 Risk + 실시간 Risk 모두 반드시 여기만 통과
 */
export const useVipRiskHistoryStore =
  create<RiskHistoryState>((set) => ({
    history: [],

    append: (item) =>
      set((state) => ({
        history: [...state.history, item],
      })),

    reset: () => ({
      history: [],
    }),

    // ✅ 최초 진입 시 서버에서 받은 "확정 Risk"만 세팅
    hydrate: (items) =>
      set(() => ({
        history: items,
      })),
  }))
