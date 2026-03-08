'use client'

import { create } from 'zustand'

export type ActionGateState = 'OBSERVE' | 'CAUTION' | 'IGNORE'

type VIPMarketState = {
  oi: number
  volume: number
  fundingRate: number

  whaleIntensity: number
  whaleRatio: number
  whaleNet: number
  fmai: number

  absorption: number
  sweep: number

  actionGateState: ActionGateState
  macd?: any

  decision?: string
  dominant?: string
  confidence?: number

  ts: number

  update: (data: Partial<VIPMarketState>) => void
}

export const useVIPMarketStore = create<VIPMarketState>((set) => ({
  oi: 0,
  volume: 0,
  fundingRate: 0,

  whaleIntensity: 0,
  whaleRatio: 0,
  whaleNet: 0,
  fmai: 0,

  absorption: 0,
  sweep: 0,

  actionGateState: 'OBSERVE',
  macd: null,

  decision: undefined,
  dominant: undefined,
  confidence: undefined,

  ts: 0,

  update: (data) =>
    set((state) => {
      let changed = false
      const next: Partial<VIPMarketState> = {}

      for (const key in data) {
        const k = key as keyof VIPMarketState

        if (state[k] !== data[k]) {
          ;(next as any)[k] = data[k]
          changed = true
        }
      }

      return changed ? { ...state, ...next } : state
    }),
}))

/* =========================================================
   Scheduler
========================================================= */

let pending: Partial<VIPMarketState> | null = null
let scheduled = false

const UPDATE_INTERVAL = 250
let lastFlush = 0

export function scheduleVIPMarketUpdate(
  data: Partial<VIPMarketState>,
) {
  pending = { ...(pending || {}), ...data }

  if (scheduled) return

  scheduled = true

  const now = performance.now()
  const delay = Math.max(0, UPDATE_INTERVAL - (now - lastFlush))

  setTimeout(() => {
    if (pending) {
      useVIPMarketStore.getState().update(pending)
    }

    pending = null
    scheduled = false
    lastFlush = performance.now()
  }, delay)
}
