'use client'

import { useMasterMarketStore } from '@/lib/market/store/masterMarketStore'
import type { ActionGateState } from '@/components/system/ActionGateStatus'

const DEFAULT_STATE: ActionGateState = 'OBSERVE'

export function useActionGateState(
  symbol: string,
): ActionGateState {

  return useMasterMarketStore((store) => {
    const state = store.state

    if (!state) return DEFAULT_STATE
    if (state.symbol !== symbol) return DEFAULT_STATE

    return state.actionGate ?? DEFAULT_STATE
  })
}
