// lib/realtime/useRealtimeMarketComposite.ts

'use client'

import { useMemo } from 'react'
import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

type CompositeState = {
  oi: number | null
  oiDelta: number | null
  oiDirection: 'UP' | 'DOWN' | 'FLAT' | null

  volume: number | null

  /**
   * 🔥 whaleIntensity SSOT = 0~100
   */
  whaleIntensity: number | null

  /**
   * 🔥 whaleAvg SSOT = 0~100
   */
  whaleAvg: number | null

  whaleTrend: 'UP' | 'DOWN' | 'FLAT' | null
  whaleSpike: boolean

  funding: number | null

  connected: boolean
  lastUpdatedAt: number | null
}

export function useRealtimeMarketComposite(
  symbol: string,
) {
  void symbol

  const oi = useVIPMarketStore((s) => s.oi)
  const oiDelta = useVIPMarketStore((s) => s.oiDelta)
  const volume = useVIPMarketStore((s) => s.volume)
  const whaleIntensity = useVIPMarketStore(
    (s) => s.whaleIntensity,
  )
  const fundingRate = useVIPMarketStore(
    (s) => s.fundingRate,
  )
  const ts = useVIPMarketStore((s) => s.ts)
  const lastRealtimeTs = useVIPMarketStore(
    (s) => s.lastRealtimeTs,
  )
  const realtimeDelayed = useVIPMarketStore(
    (s) => s.realtimeDelayed,
  )

  return useMemo<CompositeState>(() => {
    return {
      oi:
        oi !== 0
          ? oi
          : null,

      oiDelta,

      oiDirection:
        oiDelta > 0
          ? 'UP'
          : oiDelta < 0
            ? 'DOWN'
            : 'FLAT',

      volume:
        volume !== 0
          ? volume
          : null,

      whaleIntensity:
        whaleIntensity !== 0
          ? whaleIntensity
          : null,

      whaleAvg: null,
      whaleTrend: null,
      whaleSpike: false,

      funding: fundingRate,

      connected:
        lastRealtimeTs > 0 && !realtimeDelayed,

      lastUpdatedAt:
        ts > 0 ? ts : null,
    }
  }, [
    oi,
    oiDelta,
    volume,
    whaleIntensity,
    fundingRate,
    ts,
    lastRealtimeTs,
    realtimeDelayed,
  ])
}
