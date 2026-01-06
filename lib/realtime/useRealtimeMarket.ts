'use client'

import { useCallback, useState } from 'react'
import { useRealtimeStream } from './useRealtimeStream'
import type { RealtimeEvent } from './eventTypes'

export type RealtimeMarketState = {
  price: number | null
  openInterest: number | null
  lastUpdateTs: number | null
  connected: boolean
}

const initialState: RealtimeMarketState = {
  price: null,
  openInterest: null,
  lastUpdateTs: null,
  connected: false,
}

/**
 * ✅ CASINO 전용
 * PRICE + OI 실시간 상태
 */
export function useRealtimeMarket(
  symbol: string = 'BTCUSDT',
) {
  const [state, setState] =
    useState<RealtimeMarketState>(initialState)

  const onEvent = useCallback(
    (e: unknown) => {
      if (!e || typeof e !== 'object') return

      const evt = e as any

      // 다른 심볼 이벤트 무시
      if (
        evt.symbol &&
        evt.symbol !== symbol
      ) {
        return
      }

      // ✅ PRICE
      if (
        evt.type === 'PRICE_TICK' &&
        typeof evt.price === 'number'
      ) {
        setState(prev => ({
          ...prev,
          price: evt.price,
          lastUpdateTs: evt.ts ?? Date.now(),
          connected: true,
        }))
        return
      }

      // ✅ OI
      if (
        evt.type === 'OI_TICK' &&
        typeof evt.openInterest === 'number'
      ) {
        setState(prev => ({
          ...prev,
          openInterest: evt.openInterest,
          lastUpdateTs: evt.ts ?? Date.now(),
          connected: true,
        }))
        return
      }

      // ✅ SSE 상태 이벤트 (타입 느슨 처리)
      if (
        evt.type === 'connected' ||
        evt.type === 'ping'
      ) {
        setState(prev => ({
          ...prev,
          connected: true,
        }))
      }
    },
    [symbol],
  )

  useRealtimeStream(onEvent)

  return state
}
