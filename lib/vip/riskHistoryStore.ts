import { create } from 'zustand'

export type RiskHistoryItem = {
  time: string
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'
  reason: string
}

type RiskHistoryState = {
  history: RiskHistoryItem[]
}

/**
 * ⚠️ SSOT: 리스크 히스토리 단일 소스
 * - 계산 ❌
 * - 해석 ❌
 * - UI ❌
 */
export const useVipRiskHistoryStore = create<RiskHistoryState>(() => ({
  history: [
    {
      time: '11:40',
      level: 'MEDIUM',
      reason: '변동성 증가',
    },
    {
      time: '12:05',
      level: 'HIGH',
      reason: '고래 체결 집중',
    },
    {
      time: '12:25',
      level: 'EXTREME',
      reason: '급격한 방향성 붕괴',
    },
  ],
}))
