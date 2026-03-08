'use client'

import { create } from 'zustand'

/* =========================================================
   Types
========================================================= */

type VIPMarketState = {

  whaleIntensity: number
  whaleRatio: number
  whaleNet: number
  fmai: number

  absorption: number
  sweep: number

  /* 🔥 MARKET STATE */
  actionGateState?: string
  macd?: any

  /* 🔥 FINAL_DECISION */
  decision?: string
  dominant?: string
  confidence?: number

  ts: number

  update: (data: Partial<VIPMarketState>) => void
}

/* =========================================================
   Store
========================================================= */

export const useVIPMarketStore = create<VIPMarketState>((set) => ({

  whaleIntensity: 0,
  whaleRatio: 0,
  whaleNet: 0,
  fmai: 0,

  absorption: 0,
  sweep: 0,

  /* 🔥 AI Gate 상태 */
  actionGateState: 'OBSERVE',
  macd: null,

  /* 🔥 FINAL_DECISION 초기값 */
  decision: undefined,
  dominant: undefined,
  confidence: undefined,

  ts: 0,

  update: (data) =>
    set((state) => {

      let changed = false

      const next = { ...state }

      for (const key in data) {

        const k = key as keyof VIPMarketState

        if (state[k] !== data[k]) {
          ;(next as any)[k] = data[k]
          changed = true
        }

      }

      return changed ? next : state

    }),

}))

/* =========================================================
   🔥 Micro Batch Scheduler (60fps limit)
========================================================= */

let pending: Partial<VIPMarketState> | null = null
let scheduled = false
let lastUpdate = 0

const FRAME_LIMIT = 16 // ~60fps

export function scheduleVIPMarketUpdate(
  data: Partial<VIPMarketState>
) {

  pending = { ...(pending || {}), ...data }

  if (scheduled) return

  scheduled = true

  requestAnimationFrame(() => {

    const now = performance.now()

    if (now - lastUpdate < FRAME_LIMIT) {
      scheduled = false
      return
    }

    lastUpdate = now

    if (pending) {
      useVIPMarketStore.getState().update(pending)
    }

    pending = null
    scheduled = false

  })
}
