'use client'

import { useEffect, useRef, useState } from 'react'
import { subscribeMarketPrice } from '@/lib/realtime/marketChannel'
import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

type RealtimePriceState = {
  price: number | null
  prevPrice: number | null
  connected: boolean
  lastUpdatedAt: number | null
}

const INITIAL_STATE: RealtimePriceState = {
  price: null,
  prevPrice: null,
  connected: false,
  lastUpdatedAt: null,
}

export function useRealtimePrice(symbol: string) {
  const [state, setState] = useState<RealtimePriceState>(INITIAL_STATE)

  const prevPriceRef = useRef<number | null>(null)

  const lastUpdateRef = useRef(0)

  useEffect(() => {
    if (!symbol) return

    const upperSymbol = symbol.toUpperCase()

    const unsubscribe = subscribeMarketPrice(
      upperSymbol,
      (price, ts) => {
        const now = Date.now()

        /* 🔥 throttle */
        if (now - lastUpdateRef.current < 250) return
        lastUpdateRef.current = now

        /* =====================================================
           🔥 핵심 추가 (원상복구)
        ===================================================== */
        useVIPMarketStore.getState().update({
          price,
          ts: ts ?? now,
        })

        /* 기존 UI 상태 유지 */
        setState(() => {
          const next = {
            price,
            prevPrice: prevPriceRef.current,
            connected: true,
            lastUpdatedAt: now,
          }

          prevPriceRef.current = price
          return next
        })
      },
    )

    return () => {
      unsubscribe()
      prevPriceRef.current = null

      setState((s) => ({
        ...s,
        connected: false,
      }))
    }
  }, [symbol])

  return state
}
