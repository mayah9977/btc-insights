'use client'

import { useEffect, useRef, useState } from 'react'
import { subscribeMarketPrice } from '@/lib/realtime/marketChannel'

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

  /* 🔥 throttle 추가 */
  const lastUpdateRef = useRef(0)

  useEffect(() => {
    if (!symbol) return

    const upperSymbol = symbol.toUpperCase()

    const unsubscribe = subscribeMarketPrice(
      upperSymbol,
      (price) => {
        const now = Date.now()

        /* 🔥 250ms throttle */
        if (now - lastUpdateRef.current < 250) return
        lastUpdateRef.current = now

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
