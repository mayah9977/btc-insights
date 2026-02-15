'use client'

import { create } from 'zustand'
import type { LiveBollingerCommentary } from '@/lib/market/actionGate/liveBollingerCommentary'

type State = {
  last: LiveBollingerCommentary | null
  set: (v: LiveBollingerCommentary) => void
  clear: () => void
}

const TTL_MS = 8000

export const useLiveBollingerCommentaryStore = create<State>((set) => ({
  last: null,
  set: (v) => set({ last: v }),
  clear: () => set({ last: null }),
}))

export function useLiveBollingerCommentary() {
  return useLiveBollingerCommentaryStore((s) => s.last)
}

export function applyLiveBollingerCommentary(
  payload: LiveBollingerCommentary,
) {
  // 1️⃣ 즉시 반영
  useLiveBollingerCommentaryStore.getState().set(payload)

  // 2️⃣ TTL 기반 자동 소멸 (항상 최신 state 재조회)
  setTimeout(() => {
    const current =
      useLiveBollingerCommentaryStore.getState().last

    if (current?.at === payload.at) {
      useLiveBollingerCommentaryStore.getState().clear()
    }
  }, TTL_MS)
}
