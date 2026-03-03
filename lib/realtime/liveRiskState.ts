import { create } from 'zustand'
import type { RiskLevel } from '@/lib/vip/riskTypes'

/* =========================================================
   ⚠️ LIVE RISK STATE (DISABLED)
   ---------------------------------------------------------
   - Strip 구조 분리로 인해 더 이상 사용되지 않음
   - 기존 import 호환성 유지를 위한 Stub
   - 모든 로직 비활성화
========================================================= */

export type RiskDirection = 'UP' | 'DOWN' | 'STABLE'
export type MarketPulse = 'STABLE' | 'ACCELERATING'

export type LiveRiskState = {
  level: RiskLevel
  startedAt: number
  prevLevel: RiskLevel | null
  direction: RiskDirection
  whaleAccelerated: boolean
  whalePulse: boolean
  marketPulse: MarketPulse
  durationSec: number
}

export type LiveRiskStore = {
  state: LiveRiskState | null
  update: (input: {
    level: RiskLevel
    ts: number
    whaleAccelerated?: boolean
    preExtreme?: boolean
  }) => void
  triggerWhalePulse: () => void
  reset: () => void
}

/* =========================================================
   🔒 Disabled Store (No-Op)
========================================================= */

export const useLiveRiskState = create<LiveRiskStore>(() => ({
  state: null,

  update: () => {
    // 🔕 Disabled
  },

  triggerWhalePulse: () => {
    // 🔕 Disabled
  },

  reset: () => {
    // 🔕 Disabled
  },
}))
