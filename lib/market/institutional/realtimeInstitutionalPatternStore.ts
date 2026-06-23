// lib/market/institutional/realtimeInstitutionalPatternStore.ts

'use client'

import { create } from 'zustand'

import type {
  InstitutionalPatternIntensity,
  InstitutionalPatternRisk,
} from '@/lib/market/patterns/detectInstitutionalPattern'

export type RealtimeInstitutionalPattern = {
  type: string
  pattern: string
  title: string
  summary: string
  intensity: InstitutionalPatternIntensity
  risk: InstitutionalPatternRisk
  confirmedCandleTs: number
  ts: number
}

type RealtimeInstitutionalPatternState = {
  pattern: RealtimeInstitutionalPattern | null

  setPattern: (
    pattern: RealtimeInstitutionalPattern,
  ) => void

  clearPattern: () => void
}

export const useRealtimeInstitutionalPatternStore =
  create<RealtimeInstitutionalPatternState>(
    (set, get) => ({
      pattern: null,

      setPattern: (pattern) => {
        const current = get().pattern

        if (
          current &&
          current.confirmedCandleTs >=
            pattern.confirmedCandleTs
        ) {
          return
        }

        set({
          pattern,
        })
      },

      clearPattern: () => {
        set({
          pattern: null,
        })
      },
    }),
  )
  