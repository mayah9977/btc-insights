'use client'

import { useRef } from 'react'
import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

type RealtimeVolumeState = {
  volume: number | null
  rolling10s: number
  connected: boolean
  lastUpdatedAt: number | null
}

const HISTORY_LIMIT = 10

export function useRealtimeVolume(symbol: string): RealtimeVolumeState {

  const volume = useVIPMarketStore((s) => s.volume)
  const ts = useVIPMarketStore((s) => s.ts)

  const historyRef = useRef<number[]>([])

  if (volume != null) {

    const history = historyRef.current

    if (history.length < HISTORY_LIMIT) {
      history.push(volume)
    } else {
      history.shift()
      history.push(volume)
    }

    historyRef.current = history
  }

  const rolling10s = historyRef.current.reduce((a, b) => a + b, 0)

  return {
    volume: volume ?? null,
    rolling10s,
    connected: volume !== undefined,
    lastUpdatedAt: ts ?? null,
  }
}
