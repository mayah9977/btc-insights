'use client'

import { useEffect, useMemo, useState } from 'react'
import { subscribeMarketVolume } from '@/lib/realtime/marketChannel'

type RealtimeVolumeState = {
  volume: number | null
  rolling10s: number
  connected: boolean
  lastUpdatedAt: number | null
}

const INITIAL: RealtimeVolumeState = {
  volume: null,
  rolling10s: 0,
  connected: false,
  lastUpdatedAt: null,
}

export function useRealtimeVolume(symbol: string) {
  const [volume, setVolume] = useState<number | null>(null)
  const [history, setHistory] = useState<number[]>([])
  const [connected, setConnected] = useState(false)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null)

  useEffect(() => {
    if (!symbol) return

    const upperSymbol = symbol.toUpperCase()

    const unsubscribe = subscribeMarketVolume(
      upperSymbol,
      (v) => {
        setVolume(v)
        setConnected(true)
        setLastUpdatedAt(Date.now())

        setHistory(prev => {
          const next = [...prev.slice(-9), v]
          return next
        })
      },
    )

    return () => {
      unsubscribe()
      setConnected(false)
    }
  }, [symbol])

  const rolling10s = useMemo(() => {
    return history.reduce((a, b) => a + b, 0)
  }, [history])

  return {
    volume,
    rolling10s,
    connected,
    lastUpdatedAt,
  }
}
