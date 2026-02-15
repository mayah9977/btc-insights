import { useEffect, useState } from 'react'
import type { ActionGateState } from '@/components/system/ActionGateStatus'
import { getActionGateState } from '@/lib/market/store/actionGateStore'

const DEFAULT_STATE: ActionGateState = 'OBSERVE'
const POLL_INTERVAL_MS = 500

export function useActionGateState(symbol: string): ActionGateState {
  const [state, setState] = useState<ActionGateState>(
    getActionGateState(symbol) ?? DEFAULT_STATE,
  )

  useEffect(() => {
    let mounted = true

    const tick = () => {
      const next =
        getActionGateState(symbol) ?? DEFAULT_STATE

      setState(prev => (prev !== next ? next : prev))
    }

    tick() // initial sync

    const id = setInterval(tick, POLL_INTERVAL_MS)

    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [symbol])

  return state
}
