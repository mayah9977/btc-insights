'use client'

import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

type RealtimeOIState = {
  openInterest: number | null
  delta: number
  direction: 'UP' | 'DOWN' | 'FLAT'
  connected: boolean
  lastUpdatedAt: number | null
}

export function useRealtimeOI(symbol: string): RealtimeOIState {
  const oi = useVIPMarketStore((s) => s.oi)
  const delta = useVIPMarketStore((s) => s.oiDelta)
  const ts = useVIPMarketStore((s) => s.ts)

  let direction: 'UP' | 'DOWN' | 'FLAT' = 'FLAT'

  if (delta > 0) direction = 'UP'
  else if (delta < 0) direction = 'DOWN'

  return {
    openInterest: oi ?? null,
    delta: delta ?? 0,
    direction,
    connected: oi !== undefined,
    lastUpdatedAt: ts ?? null,
  }
}
