'use client'

import { create } from 'zustand'
import type { FinalDecision } from '@/lib/market/actionGate/decisionEngine'
import type { ActionGateState } from '@/components/system/ActionGateStatus'
import type { MACDState } from '@/lib/market/macd'

/* =========================================================
   State Types
========================================================= */

export interface MasterMarketState {
  symbol: string
  decision: FinalDecision
  actionGate: ActionGateState
  macd: MACDState | null
  dominant: 'LONG' | 'SHORT' | 'NONE'
  confidence: number
  updatedAt: number
}

interface MasterMarketStore extends MasterMarketState {
  update: (input: Partial<MasterMarketState>) => void
  reset: () => void
}

/* =========================================================
   Initial State
========================================================= */

const initialState: MasterMarketState = {
  symbol: 'BTCUSDT',
  decision: 'WAIT',
  actionGate: 'OBSERVE',
  macd: null,
  dominant: 'NONE',
  confidence: 0,
  updatedAt: Date.now(),
}

/* =========================================================
   Store
========================================================= */

export const useMasterMarketStore = create<MasterMarketStore>((set) => ({
  ...initialState,

  /* =========================
     Update (Diff Safe)
  ========================= */

  update: (input) =>
    set((state) => {

      let changed = false
      const next: Partial<MasterMarketState> = {}

      Object.entries(input).forEach(([key, value]) => {

        if (value === undefined) return

        const k = key as keyof MasterMarketState

        if (state[k] !== value) {
          ;(next as any)[k] = value
          changed = true
        }

      })

      if (!changed) return state

      return {
        ...state,
        ...next,
        updatedAt: Date.now(),
      }

    }),

  /* =========================
     Reset
  ========================= */

  reset: () =>
    set({
      ...initialState,
    }),

}))

/* =========================================================
   🔥 Micro Batch Scheduler (60fps limit)
========================================================= */

let pending: Partial<MasterMarketState> | null = null
let scheduled = false
let lastUpdate = 0

const FRAME_LIMIT = 16 // ~60fps

export function scheduleMasterMarketUpdate(
  data: Partial<MasterMarketState>
) {

  pending = { ...(pending || {}), ...data }

  if (scheduled) return

  scheduled = true

  requestAnimationFrame(() => {

    const now = performance.now()

    /* 🔥 60fps 제한 */

    if (now - lastUpdate < FRAME_LIMIT) {
      scheduled = false
      return
    }

    lastUpdate = now

    if (pending) {
      useMasterMarketStore.getState().update(pending)
    }

    pending = null
    scheduled = false

  })
}
