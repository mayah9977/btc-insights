'use client'

import { useEffect, useState } from 'react'
import { subscribeMarketPrice } from '@/lib/realtime/marketChannel'

type RealtimePriceState = {
  price: number | null
  connected: boolean
  lastUpdatedAt: number | null
}

const INITIAL_STATE: RealtimePriceState = {
  price: null,
  connected: false,
  lastUpdatedAt: null,
}

export function useRealtimePrice(symbol: string) {
  const [state, setState] = useState(INITIAL_STATE)

  useEffect(() => {
    if (!symbol) return

    const unsubscribe = subscribeMarketPrice(
      symbol,
      (price) => {
        setState({
          price,
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
