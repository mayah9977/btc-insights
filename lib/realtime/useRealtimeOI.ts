'use client'

import { useEffect, useState } from 'react'
import { subscribeOpenInterest } from '@/lib/realtime/marketChannel'

type RealtimeOIState = {
  openInterest: number | null
  delta: number
  direction: 'UP' | 'DOWN' | 'FLAT'
  connected: boolean
  lastUpdatedAt: number | null
}

const INITIAL_STATE: RealtimeOIState = {
  openInterest: null,
  delta: 0,
  direction: 'FLAT',
  connected: false,
  lastUpdatedAt: null,
}

export function useRealtimeOI(symbol: string) {

  const [state, setState] = useState<RealtimeOIState>(INITIAL_STATE)

  useEffect(() => {

    if (!symbol) return

    const upperSymbol = symbol.toUpperCase()

    const unsubscribe = subscribeOpenInterest(
      upperSymbol,
      (openInterest, delta, direction, ts) => {

        setState(prev => {

          const normalizedDelta =
            Number.isFinite(delta) ? delta : 0

          const normalizedDirection =
            direction ?? 'FLAT'

          /* 값 동일하면 업데이트 차단 */

          if (
            prev.openInterest === openInterest &&
            prev.delta === normalizedDelta &&
            prev.direction === normalizedDirection
          ) {
            return prev
          }

          return {
            openInterest,
            delta: normalizedDelta,
            direction: normalizedDirection,
            connected: true,
            lastUpdatedAt: ts ?? Date.now(),
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

  return state

}
