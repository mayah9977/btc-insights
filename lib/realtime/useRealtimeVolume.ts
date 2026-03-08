'use client'

import { useEffect, useState } from 'react'
import { subscribeMarketVolume } from '@/lib/realtime/marketChannel'

type RealtimeVolumeState = {
  volume: number | null
  history: number[]
  rolling10s: number
  connected: boolean
  lastUpdatedAt: number | null
}

const HISTORY_LIMIT = 10

const INITIAL: RealtimeVolumeState = {
  volume: null,
  history: [],
  rolling10s: 0,
  connected: false,
  lastUpdatedAt: null,
}

export function useRealtimeVolume(symbol: string) {

  const [state, setState] = useState<RealtimeVolumeState>(INITIAL)

  useEffect(() => {

    if (!symbol) return

    const upperSymbol = symbol.toUpperCase()

    const unsubscribe = subscribeMarketVolume(
      upperSymbol,
      (v) => {

        setState(prev => {

          const history =
            prev.history.length < HISTORY_LIMIT
              ? [...prev.history, v]
              : [...prev.history.slice(1), v]

          const rolling10s =
            history.reduce((a, b) => a + b, 0)

          return {
            volume: v,
            history,
            rolling10s,
            connected: true,
            lastUpdatedAt: Date.now(),
          }

        })

      },
    )

    return () => {

      unsubscribe()

      setState(prev => ({
        ...prev,
        connected: false,
      }))

    }

  }, [symbol])

  return {
    volume: state.volume,
    rolling10s: state.rolling10s,
    connected: state.connected,
    lastUpdatedAt: state.lastUpdatedAt,
  }

}
