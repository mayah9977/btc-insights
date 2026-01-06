'use client'

import { useCallback, useState } from 'react'
import { useRealtimeStream } from './useRealtimeStream'
import type { RealtimeEvent } from './eventTypes'

type RealtimePriceState = {
  price: number | null
  prevPrice: number | null
  lastUpdateTs: number | null
}

const initialState: RealtimePriceState = {
  price: null,
  prevPrice: null,
  lastUpdateTs: null,
}

export function useRealtimePrice(symbol: string) {
  const [state, setState] =
    useState<RealtimePriceState>(initialState)

  const onEvent = useCallback(
    (e: RealtimeEvent) => {
      if (
        e?.type !== 'PRICE_TICK' ||
        e.symbol !== symbol ||
        typeof e.price !== 'number'
      ) {
        return
      }

      setState(prev => ({
        price: e.price,
        prevPrice: prev.price, // ✅ 핵심 수정
        lastUpdateTs: e.ts,
      }))
    },
    [symbol],
  )

  useRealtimeStream(onEvent)

  return state
}
