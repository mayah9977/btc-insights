'use client'

import { useEffect, useState } from 'react'
import { subscribeMarketVolume } from '@/lib/realtime/marketChannel'

type RealtimeVolumeState = {
  volume: number | null
  connected: boolean
  lastUpdatedAt: number | null
}

const INITIAL: RealtimeVolumeState = {
  volume: null,
  connected: false,
  lastUpdatedAt: null,
}

export function useRealtimeVolume(symbol: string) {
  const [state, setState] =
    useState<RealtimeVolumeState>(INITIAL)

  useEffect(() => {
    if (!symbol) return

    const upperSymbol = symbol.toUpperCase()

    const unsubscribe = subscribeMarketVolume(
      upperSymbol,
      (volume) => {
        setState({
          volume,
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
