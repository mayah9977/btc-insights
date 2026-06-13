//lib/realtime/useRealtimePrice.ts  

'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

type RealtimePriceState = {
  price: number | null
  prevPrice: number | null
  connected: boolean
  lastUpdatedAt: number | null
}

export function useRealtimePrice(symbol: string) {
  void symbol

  const prevPriceRef = useRef<number | null>(null)

  const price = useVIPMarketStore((s) => s.price)
  const ts = useVIPMarketStore((s) => s.ts)
  const lastRealtimeTs = useVIPMarketStore(
    (s) => s.lastRealtimeTs,
  )
  const realtimeDelayed = useVIPMarketStore(
    (s) => s.realtimeDelayed,
  )

  useEffect(() => {
    if (price > 0) {
      prevPriceRef.current = price
    }
  }, [price])

  return useMemo<RealtimePriceState>(() => {
    const safePrice =
      price > 0 ? price : null

    return {
      price: safePrice,
      prevPrice: prevPriceRef.current,
      connected:
        lastRealtimeTs > 0 && !realtimeDelayed,
      lastUpdatedAt:
        ts > 0 ? ts : null,
    }
  }, [
    price,
    ts,
    lastRealtimeTs,
    realtimeDelayed,
  ])
}
