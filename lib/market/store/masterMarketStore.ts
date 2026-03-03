'use client'

import { create } from 'zustand'
import type { FinalDecision } from '@/lib/market/actionGate/decisionEngine'
import type { ActionGateState } from '@/components/system/ActionGateStatus'
import type { MACDState } from '@/lib/market/macd'

export interface MasterMarketState {
  symbol: string
  decision: FinalDecision
  actionGate: ActionGateState
  macd: MACDState | null
  dominant: 'LONG' | 'SHORT' | 'NONE'
  confidence: number
  updatedAt: number
}

interface MasterMarketStore {
  state: MasterMarketState
  update: (input: Partial<MasterMarketState>) => void
  reset: () => void
}

const initialState: MasterMarketState = {
  symbol: 'BTCUSDT',
  decision: 'WAIT',
  actionGate: 'OBSERVE',
  macd: null,
  dominant: 'NONE',
  confidence: 0,
  updatedAt: Date.now(),
}

export const useMasterMarketStore = create<MasterMarketStore>((set) => ({
  state: initialState,

  update: (input) =>
    set((prev) => ({
      state: {
        ...prev.state,
        ...input,
        updatedAt: Date.now(),
      },
    })),

  reset: () =>
    set({
      state: initialState,
    }),
}))
