'use client'

import { useEffect, useState } from 'react'
import { subscribeOpenInterest } from '@/lib/realtime/marketChannel'

type RealtimeOIState = {
  openInterest: number | null
  connected: boolean
  lastUpdatedAt: number | null
}

const INITIAL_STATE: RealtimeOIState = {
  openInterest: null,
  connected: false,
  lastUpdatedAt: null,
}

export function useRealtimeOI(symbol: string) {
  const [state, setState] = useState(INITIAL_STATE)

  useEffect(() => {
    if (!symbol) return

    const unsubscribe = subscribeOpenInterest(
      symbol,
      (openInterest) => {
        setState({
          openInterest,
          connected: true,
          lastUpdatedAt: Date.now(),
        })
      },
    )

    return () => {
      unsubscribe()
      setState(s => ({ ...s, connected: false }))
    }
  }, [symbol])

  return state
}
