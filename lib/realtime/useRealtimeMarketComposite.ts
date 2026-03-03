'use client'

import { useEffect, useRef, useState } from 'react'
import {
  subscribeOpenInterest,
  subscribeMarketVolume,
  subscribeWhaleIntensity,
} from '@/lib/realtime/marketChannel'

type CompositeState = {
  oi: number | null
  oiDelta: number | null
  oiDirection: 'UP' | 'DOWN' | 'FLAT' | null

  volume: number | null

  whaleIntensity: number | null
  whaleAvg: number | null
  whaleTrend: 'UP' | 'DOWN' | 'FLAT' | null
  whaleSpike: boolean

  funding: number | null // (현재 SSE에 funding subscribe 없으면 null 유지)

  connected: boolean
  lastUpdatedAt: number | null
}

const INITIAL: CompositeState = {
  oi: null,
  oiDelta: null,
  oiDirection: null,

  volume: null,

  whaleIntensity: null,
  whaleAvg: null,
  whaleTrend: null,
  whaleSpike: false,

  funding: null,

  connected: false,
  lastUpdatedAt: null,
}

export function useRealtimeMarketComposite(symbol: string) {
  const [state, setState] = useState<CompositeState>(INITIAL)

  // 연결 상태 추적용
  const connectionRef = useRef(false)

  useEffect(() => {
    if (!symbol) return

    const upper = symbol.toUpperCase()

    /* =========================
       OI
    ========================= */
    const unsubOI = subscribeOpenInterest(
      upper,
      (openInterest, delta, direction, ts) => {
        connectionRef.current = true

        setState(prev => ({
          ...prev,
          oi: openInterest,
          oiDelta: delta,
          oiDirection: direction,
          connected: true,
          lastUpdatedAt: ts ?? Date.now(),
        }))
      },
    )

    /* =========================
       Volume
    ========================= */
    const unsubVol = subscribeMarketVolume(
      upper,
      (volume, ts) => {
        connectionRef.current = true

        setState(prev => ({
          ...prev,
          volume,
          connected: true,
          lastUpdatedAt: ts ?? Date.now(),
        }))
      },
    )

    /* =========================
       Whale Intensity
    ========================= */
    const unsubWhale = subscribeWhaleIntensity(
      upper,
      (intensity, avg, trend, isSpike, ts) => {
        connectionRef.current = true

        setState(prev => ({
          ...prev,
          whaleIntensity: intensity,
          whaleAvg: avg,
          whaleTrend: trend,
          whaleSpike: isSpike,
          connected: true,
          lastUpdatedAt: ts ?? Date.now(),
        }))
      },
    )

    return () => {
      unsubOI()
      unsubVol()
      unsubWhale()

      setState(prev => ({
        ...prev,
        connected: false,
      }))
    }
  }, [symbol])

  return state
}
