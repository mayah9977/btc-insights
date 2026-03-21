'use client'

import { useRef, useEffect } from 'react'
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

  /* =========================
     Update history on volume change
  ========================= */
  useEffect(() => {
    if (volume == null) return

    const history = historyRef.current

    if (history.length < HISTORY_LIMIT) {
      history.push(volume)
    } else {
      history.shift()
      history.push(volume)
    }

    historyRef.current = history
  }, [volume])

  /* =========================
     Rolling 10s volume
  ========================= */
  const rolling10s =
    historyRef.current.length === 0
      ? 0
      : historyRef.current.reduce((a, b) => a + b, 0)

  return {
    volume: volume ?? null,
    rolling10s,
    connected: volume !== undefined,
    lastUpdatedAt: ts ?? null,
  }
}
