'use client'

import { useEffect, useState } from 'react'
import { subscribeOpenInterest } from '@/lib/realtime/marketChannel'

type RealtimeOIState = {
  openInterest: number | null
  delta: number
  direction: 'UP' | 'DOWN' | 'FLAT'
  connected: boolean
  lastUpdatedAt: number | null
}

const INITIAL_STATE: RealtimeOIState = {
  openInterest: null,
  delta: 0,
  direction: 'FLAT',
  connected: false,
  lastUpdatedAt: null,
}

export function useRealtimeOI(symbol: string) {
  const [state, setState] = useState<RealtimeOIState>(INITIAL_STATE)

  useEffect(() => {
    if (!symbol) return

    const upperSymbol = symbol.toUpperCase()

    const unsubscribe = subscribeOpenInterest(
      upperSymbol,
      (openInterest, delta, direction, ts) => {
        setState({
          openInterest,
          delta: Number.isFinite(delta) ? delta : 0,
          direction: direction ?? 'FLAT',
          connected: true,
          lastUpdatedAt: ts ?? Date.now(),
        })
      },
    )

    return () => {
      unsubscribe()
      setState(s => ({
        ...s,
        connected: false,
      }))
    }
  }, [symbol])

  return state
}
