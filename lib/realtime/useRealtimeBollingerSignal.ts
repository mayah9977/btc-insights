'use client'

import { create } from 'zustand'
import type { BollingerSignal } from '@/lib/market/actionGate/signalType'

/**
 * UI-only store
 * - ❌ 판단 / 계산 없음
 * - ⭕ "확정된 BB_SIGNAL(30m)"만 보관
 * - Action Gate / Observation UI의 단일 입력
 */
type State = {
  last: BollingerSignal | null
  setLast: (v: BollingerSignal | null) => void
}

const useBollingerSignalStore = create<State>((set) => ({
  last: null,
  setLast: (v) => set({ last: v }),
}))

/**
 * ✅ UI 구독 훅
 * - Action Gate
 * - BBSignalCard
 * - Observation UI
 */
export function useRealtimeBollingerSignal() {
  return useBollingerSignalStore((s) => s.last)
}

/**
 * ✅ BB_SIGNAL → UI bridge (SSOT boundary)
 *
 * 원칙:
 * - confirmed 30m 신호만 허용
 * - 판단 / 해석 ❌
 * - 그대로 전달만 수행
 */
export function applyRealtimeBollingerSignal(signal: BollingerSignal) {
  if (!signal) return
  // 🔒 30m 확정 봉만 UI에 반영
  if (signal.timeframe !== '30m') return
  if (signal.confirmed !== true) return

  useBollingerSignalStore.getState().setLast(signal)
}
