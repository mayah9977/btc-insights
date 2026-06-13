// lib/market/store/vipMarketStore.ts

'use client'

import { create } from 'zustand'
import { FinalNarrativeReport } from '@/lib/market/narrative/types'
import { accumulateInstitutionalEvidence } from '@/lib/market/institutional/institutionalEvidenceAccumulator'

export type ActionGateState = 'OBSERVE' | 'CAUTION' | 'IGNORE'

export type FundingBias =
  | 'LONG_HEAVY'
  | 'SHORT_HEAVY'
  | 'NEUTRAL'

const ACTION_GATE_DEBOUNCE_MS = 1200
const ACTION_GATE_DOWNGRADE_DEBOUNCE_MS = 2500

const ACTION_GATE_RANK: Record<ActionGateState, number> = {
  OBSERVE: 0,
  CAUTION: 1,
  IGNORE: 2,
}

type VIPMarketState = {
  oi: number
  oiDelta: number

  volume: number
  volumeRatio: number

  fundingRate: number
  fundingBias: FundingBias

  price: number
  priceChangePercent: number

  whaleIntensity: number

  whaleRatio: number
  whaleNet: number
  whaleNetRatio: number

  fmai: number
  absorption: number
  sweep: number

  actionGateState: ActionGateState

  macd?: any
  decision?: string
  dominant?: string
  confidence?: number

  ts: number

  /**
   * Market-feed freshness state.
   *
   * Do not update these fields on every store update.
   * They are updated only when useVIPMarketStream receives
   * primary market-feed ticks through realtimeAlivePatch().
   *
   * Primary market-feed ticks:
   * PRICE / OI / VOLUME / FUNDING / WHALE.
   */
  lastRealtimeTs: number
  realtimeDelayed: boolean

  narrative: FinalNarrativeReport | null
  lastMetaKey: string

  lastDecisionTs: number
  lastActionGateTs: number

  update: (data: Partial<VIPMarketState>) => void

  markRealtimeDelayed: (
    delayed: boolean,
  ) => void

  setNarrative: (
    signalType: string,
    newNarrative: FinalNarrativeReport,
    metaKey: string,
  ) => void
}

export const useVIPMarketStore =
  create<VIPMarketState>((set, get) => ({
    oi: 0,
    oiDelta: 0,

    volume: 0,
    volumeRatio: 1,

    fundingRate: 0,
    fundingBias: 'NEUTRAL',

    price: 0,
    priceChangePercent: 0,

    whaleIntensity: 0,

    whaleRatio: 0,
    whaleNet: 0,
    whaleNetRatio: 0,

    fmai: 0,
    absorption: 0,
    sweep: 0,

    actionGateState: 'OBSERVE',

    macd: null,
    decision: undefined,
    dominant: undefined,
    confidence: undefined,

    ts: 0,
    lastRealtimeTs: 0,
    realtimeDelayed: true,

    narrative: null,
    lastMetaKey: '',

    lastDecisionTs: 0,
    lastActionGateTs: 0,

    update: (data) =>
      set((state) => {
        let changed = false
        const next: Partial<VIPMarketState> = {}
        const now = Date.now()

        for (const key in data) {
          const k = key as keyof VIPMarketState

          if (data[k] !== undefined) {
            const value = data[k]

            const isInvalidZero =
              (k === 'price' &&
                value === 0 &&
                state.price !== 0) ||
              (k === 'oi' &&
                value === 0 &&
                state.oi !== 0) ||
              (k === 'volume' &&
                value === 0 &&
                state.volume !== 0) ||
              (k === 'whaleIntensity' &&
                value === 0 &&
                state.whaleIntensity !== 0) ||
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
              if (k === 'actionGateState') {
                const previousState =
                  state.actionGateState

                const nextState =
                  value as ActionGateState

                const elapsedMs =
                  now - state.lastActionGateTs

                const isSameState =
                  previousState === nextState

                const isDowngrade =
                  ACTION_GATE_RANK[nextState] <
                  ACTION_GATE_RANK[previousState]

                const requiredDebounceMs =
                  isDowngrade
                    ? ACTION_GATE_DOWNGRADE_DEBOUNCE_MS
                    : ACTION_GATE_DEBOUNCE_MS

                if (isSameState) {
                  continue
                }

                if (
                  state.lastActionGateTs > 0 &&
                  elapsedMs < requiredDebounceMs
                ) {
                  continue
                }

                ;(next as any)[k] = nextState
                next.lastActionGateTs = now
                changed = true

                continue
              }

              if (state[k] !== value) {
                if (k === 'decision') {
                  if (now - state.lastDecisionTs < 300) {
                    continue
                  }

                  ;(next as any)[k] = value
                  next.lastDecisionTs = now
                  changed = true
                  continue
                }

                ;(next as any)[k] = value
                changed = true
              }
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

    markRealtimeDelayed: (delayed) => {
      set((state) =>
        state.realtimeDelayed === delayed
          ? state
          : {
              ...state,
              realtimeDelayed: delayed,
            },
      )
    },

    setNarrative: (
      signalType: string,
      newNarrative: FinalNarrativeReport,
      metaKey: string,
    ) => {
      const current = get().narrative

      if (get().lastMetaKey === metaKey) return

      if (
        current &&
        current.tendency ===
          newNarrative.tendency &&
        current.summary ===
          newNarrative.summary &&
        current.risk ===
          newNarrative.risk
      ) {
        return
      }

      set({
        narrative: newNarrative,
        lastMetaKey: metaKey,
      })
    },
  }))

let pending: Partial<VIPMarketState> = {}
let scheduled = false

const UPDATE_INTERVAL = 50

let lastFlush = 0

let lastAccumulationTs = 0

const INSTITUTIONAL_ACCUMULATION_INTERVAL =
  30000

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

      const nowTs = Date.now()

      if (
        nowTs - lastAccumulationTs >=
        INSTITUTIONAL_ACCUMULATION_INTERVAL
      ) {
        accumulateInstitutionalEvidence()

        lastAccumulationTs = nowTs
      }
    }

    pending = {}
    scheduled = false
    lastFlush = performance.now()
  }, delay)
}
