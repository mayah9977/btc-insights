'use client'

import { create } from 'zustand'
import { FinalNarrativeReport } from '@/lib/market/narrative/types' // ✅ added

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

  price: number
  priceChangePercent: number

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
     Narrative (NEW)
  ========================= */
  narrative: FinalNarrativeReport | null // ✅ modified
  lastMetaKey: string // ✅ modified

  /* =========================
     Store Update
  ========================= */
  update: (data: Partial<VIPMarketState>) => void

  setNarrative: ( // ✅ modified
    signalType: string,
    newNarrative: FinalNarrativeReport,
    metaKey: string
  ) => void
}

export const useVIPMarketStore =
  create<VIPMarketState>((set, get) => ({ // ✅ modified
    /* =========================
       Core Market
    ========================= */
    oi: 0,
    oiDelta: 0,

    volume: 0,
    volumeRatio: 1,

    fundingRate: 0,
    fundingBias: 'NEUTRAL',

    price: 0,
    priceChangePercent: 0,

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
       Narrative (NEW)
    ========================= */
    narrative: null, // ✅ modified
    lastMetaKey: '', // ✅ modified

    /* =========================
       Update Logic
    ========================= */
    update: (data) =>
      set((state) => {
        let changed = false
        const next: Partial<VIPMarketState> = {}

        for (const key in data) {
          const k = key as keyof VIPMarketState

          if (data[k] !== undefined) {
            const value = data[k]

            const isInvalidZero =
              (k === 'oiDelta' &&
                value === 0 &&
                state.oiDelta !== 0) ||

              (k === 'whaleNetRatio' &&
                value === 0 &&
                state.whaleNetRatio !== 0) ||

              (k === 'volumeRatio' &&
                value === 1 &&
                state.volumeRatio !== 1)

            if (!isInvalidZero) {
              ;(next as any)[k] = value
              changed = true
            }
          }
        }

        return changed
          ? {
              ...state,
              ...next,
              ts: Date.now(),
            }
          : state
      }),

    /* =========================
       Narrative Setter
    ========================= */
    setNarrative: ( // ✅ modified
      signalType,
      newNarrative,
      metaKey
    ) => {
      const current = get().narrative

      if (
        current &&
        current.tendency === newNarrative.tendency &&
        current.summary === newNarrative.summary &&
        current.risk === newNarrative.risk
      ) {
        return
      }

      set({
        narrative: newNarrative,
        lastMetaKey: metaKey,
      })
    },
  }))

/* =========================================================
   Scheduler (OPTIMIZED)
========================================================= */

let pending: Partial<VIPMarketState> = {}
let scheduled = false

// 🔥 핵심 변경 (250 → 50)
const UPDATE_INTERVAL = 50

let lastFlush = 0

export function scheduleVIPMarketUpdate(
  data: Partial<VIPMarketState>,
) {
  pending = { ...pending, ...data }

  if (scheduled) return

  scheduled = true

  const now = performance.now()
  const delay = Math.max(
    0,
    UPDATE_INTERVAL - (now - lastFlush),
  )

  setTimeout(() => {
    if (Object.keys(pending).length > 0) {
      useVIPMarketStore.getState().update(pending)
    }

    pending = {}
    scheduled = false
    lastFlush = performance.now()
  }, delay)
}
