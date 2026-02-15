'use client'

import { useCallback, useState } from 'react'
import { useRealtimeStream } from './useRealtimeStream'
import { applyRealtimeBollingerSignal } from '@/lib/realtime/useRealtimeBollingerSignal'
import { applyLiveBollingerCommentary } from '@/lib/realtime/useLiveBollingerCommentary'

export type RealtimeMarketState = {
  price: number | null
  openInterest: number | null
  volume: number | null
  fundingRate: number | null
  lastUpdateTs: number | null
  connected: boolean
}

const initialState: RealtimeMarketState = {
  price: null,
  openInterest: null,
  volume: null,
  fundingRate: null,
  lastUpdateTs: null,
  connected: false,
}

let marketStateSingleton: RealtimeMarketState = { ...initialState }

export function useRealtimeMarket(symbol: string = 'BTCUSDT') {
  const [state, setState] =
    useState<RealtimeMarketState>(marketStateSingleton)

  const normalizedSymbol = symbol.toUpperCase()

  const onEvent = useCallback(
    (e: unknown) => {
      if (!e || typeof e !== 'object') return
      const evt = e as any

      if (
        typeof evt.symbol === 'string' &&
        evt.symbol.toUpperCase() !== normalizedSymbol
      ) {
        return
      }

      /* =========================
       * PRICE
       * ========================= */
      if (evt.type === 'PRICE_TICK') {
        const price = Number(evt.price)
        if (!Number.isFinite(price)) return

        marketStateSingleton = {
          ...marketStateSingleton,
          price,
          lastUpdateTs: Date.now(),
          connected: true,
        }
        setState({ ...marketStateSingleton })
        return
      }

      /* =========================
       * OI
       * ========================= */
      if (evt.type === 'OI_TICK') {
        const openInterest = Number(evt.openInterest)
        if (!Number.isFinite(openInterest)) return

        marketStateSingleton = {
          ...marketStateSingleton,
          openInterest,
          lastUpdateTs: Date.now(),
          connected: true,
        }
        setState({ ...marketStateSingleton })
        return
      }

      /* =========================
       * VOLUME
       * ========================= */
      if (evt.type === 'VOLUME_TICK') {
        const volume = Number(evt.volume)
        if (!Number.isFinite(volume)) return

        marketStateSingleton = {
          ...marketStateSingleton,
          volume,
          lastUpdateTs: Date.now(),
          connected: true,
        }
        setState({ ...marketStateSingleton })
        return
      }

      /* =========================
       * FUNDING
       * ========================= */
      if (evt.type === 'FUNDING_RATE_TICK') {
        const fundingRate =
          typeof evt.fundingRate === 'number'
            ? evt.fundingRate
            : Number(evt.fundingRate)

        if (!Number.isFinite(fundingRate)) return

        marketStateSingleton = {
          ...marketStateSingleton,
          fundingRate,
          lastUpdateTs: Date.now(),
          connected: true,
        }
        setState({ ...marketStateSingleton })
        return
      }

      /* =========================
       * 🔥 Confirmed BB_SIGNAL
       * ========================= */
      if (evt.type === 'BB_SIGNAL') {
        applyRealtimeBollingerSignal(evt)
        return
      }

      /* =========================
       * 🔥 Live Commentary (핵심 추가)
       * ========================= */
      if (evt.type === 'BB_LIVE_COMMENTARY') {
        console.log('[CLIENT] BB_LIVE_COMMENTARY RECEIVED', evt)
        applyLiveBollingerCommentary(evt)
        return
      }

      /* =========================
       * SSE 상태
       * ========================= */
      if (evt.type === 'connected' || evt.type === 'ping') {
        marketStateSingleton = {
          ...marketStateSingleton,
          connected: true,
        }
        setState({ ...marketStateSingleton })
      }
    },
    [normalizedSymbol],
  )

  useRealtimeStream(onEvent)

  return { ...state }
}
