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

  /**
   * 🔥 whaleIntensity SSOT = 0~100
   *
   * Redis history = 0~100
   * SSE = 0~100
   * VIP store = 0~100
   * chart bridge = 0~100
   * UI 계산에서만 /100 normalize
   */
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
  narrative: FinalNarrativeReport | null
  lastMetaKey: string

  /* =========================
     Decision Stabilization
  ========================= */
  lastDecisionTs: number

  /* =========================
     Store Update
  ========================= */
  update: (data: Partial<VIPMarketState>) => void

  setNarrative: (
    signalType: string,
    newNarrative: FinalNarrativeReport,
    metaKey: string,
  ) => void
}

export const useVIPMarketStore =
  create<VIPMarketState>((set, get) => ({
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

    /**
     * 🔥 whaleIntensity SSOT = 0~100
     */
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
    narrative: null,
    lastMetaKey: '',

    /* =========================
       Decision Stabilization
    ========================= */
    lastDecisionTs: 0,

    /* =========================
       Update Logic
    ========================= */
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
              (k === 'oiDelta' &&
                value === 0 &&
                state.oiDelta !== 0) ||
              (k === 'whaleNetRatio' &&
                value === 0 &&
                state.whaleNetRatio !== 0) ||
              (k === 'volumeRatio' &&
                value === 1 &&
                state.volumeRatio !== 1)

            if (!isInvalidZero && state[k] !== value) {
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
    setNarrative: (
      signalType: string,
      newNarrative: FinalNarrativeReport,
      metaKey: string,
    ) => {
      const current = get().narrative

      // 🔥 1차 차단: metaKey 동일 → 완전 스킵
      if (get().lastMetaKey === metaKey) return

      // 🔥 2차 차단: 의미 동일 → 스킵
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

/* =========================================================
   Scheduler (OPTIMIZED)
========================================================= */

let pending: Partial<VIPMarketState> = {}
let scheduled = false

// 🔥 핵심 변경 (250 → 50)
const UPDATE_INTERVAL = 50

let lastFlush = 0

/* =========================================================
   Institutional Accumulation Throttle
   - tick accumulation 금지
   - 30초 aggregation accumulation만 허용
========================================================= */

let lastAccumulationTs = 0

const INSTITUTIONAL_ACCUMULATION_INTERVAL =
  30000

export function scheduleVIPMarketUpdate(
  data: Partial<VIPMarketState>,
) {
  //console.log('[SCHEDULE CALL]', data) // 👈 추가

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

      /**
       * 🔥 institutional accumulation throttle
       *
       * SSE tick마다 accumulation 하지 않고
       * 30초 aggregation 기반으로만 누적합니다.
       *
       * 목적:
       * - sampleCount 안정화
       * - micro noise 제거
       * - 30분 freeze snapshot 품질 향상
       * - ENUM / DecisionEngine / ActionGate 변경 없음
       */
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
