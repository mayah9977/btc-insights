'use client'

import { useMasterMarketStore } from '@/lib/market/store/masterMarketStore'
import type { ActionGateState } from '@/components/system/ActionGateStatus'

const DEFAULT_STATE: ActionGateState = 'OBSERVE'

export function useActionGateState(
  symbol: string,
): ActionGateState {

  return useMasterMarketStore((store) => {

    if (!store) return DEFAULT_STATE
    if (store.symbol !== symbol) return DEFAULT_STATE

    return store.actionGate ?? DEFAULT_STATE

  })
}
