'use client'

import { create } from 'zustand'

export type ActionGateState = 'OBSERVE' | 'CAUTION' | 'IGNORE'

export type FundingBias =
  | 'LONG_HEAVY'
  | 'SHORT_HEAVY'
  | 'NEUTRAL'

type VIPMarketState = {
  /* =========================
     Core Market
  ========================= */

  oi: number
  oiDelta: number

  volume: number
  volumeRatio: number

  fundingRate: number
  fundingBias: FundingBias

  /* =========================
     Whale
  ========================= */

  whaleIntensity: number
  whaleRatio: number
  whaleNet: number
  whaleNetRatio: number

  /* =========================
     Derived Signals
  ========================= */

  fmai: number
  absorption: number
  sweep: number

  /* =========================
     Action Gate
  ========================= */

  actionGateState: ActionGateState

  macd?: any

  decision?: string
  dominant?: string
  confidence?: number

  /* =========================
     Timestamp
  ========================= */

  ts: number

  /* =========================
     Store Update
  ========================= */

  update: (data: Partial<VIPMarketState>) => void
}

export const useVIPMarketStore =
  create<VIPMarketState>((set) => ({
    /* =========================
       Core Market
    ========================= */

    oi: 0,
    oiDelta: 0,

    volume: 0,
    volumeRatio: 1,

    fundingRate: 0,
    fundingBias: 'NEUTRAL',

    /* =========================
       Whale
    ========================= */

    whaleIntensity: 0,
    whaleRatio: 0,
    whaleNet: 0,
    whaleNetRatio: 0,

    /* =========================
       Derived Signals
    ========================= */

    fmai: 0,
    absorption: 0,
    sweep: 0,

    /* =========================
       Action Gate
    ========================= */

    actionGateState: 'OBSERVE',

    macd: null,

    decision: undefined,
    dominant: undefined,
    confidence: undefined,

    /* =========================
       Timestamp
    ========================= */

    ts: 0,

    /* =========================
       Update Logic
    ========================= */

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

        return changed
          ? { ...state, ...next }
          : state
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
  const delay = Math.max(
    0,
    UPDATE_INTERVAL - (now - lastFlush),
  )

  setTimeout(() => {
    if (pending) {
      useVIPMarketStore.getState().update(pending)
    }

    pending = null
    scheduled = false
    lastFlush = performance.now()
  }, delay)
}
