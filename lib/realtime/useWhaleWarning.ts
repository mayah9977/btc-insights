'use client'

import { useEffect, useState } from 'react'
import { subscribeWhaleWarning } from '@/lib/realtime/marketChannel'

/* =========================
 * Types
 * ========================= */
export type WhaleWarningEvent = {
  type: 'WHALE_WARNING'
  symbol: string
  whaleIntensity: number
  avg: number
  ts: number
}

type WhaleWarningState = {
  warning: WhaleWarningEvent | null
  connected: boolean
  lastUpdatedAt: number | null
}

/* =========================
 * Initial State
 * ========================= */
const INITIAL_STATE: WhaleWarningState = {
  warning: null,
  connected: false,
  lastUpdatedAt: null,
}

/* =========================
 * Hook
 * ========================= */
export function useWhaleWarning(symbol: string) {
  const [state, setState] =
    useState<WhaleWarningState>(INITIAL_STATE)

  useEffect(() => {
    if (!symbol) return

    const upperSymbol = symbol.toUpperCase()

    const unsubscribe = subscribeWhaleWarning(
      upperSymbol,
      (value, avg, ts) => {
        setState({
          warning: {
            type: 'WHALE_WARNING',
            symbol: upperSymbol,
            whaleIntensity: value,
            avg,
            ts: ts ?? Date.now(),
          },
          connected: true,
          lastUpdatedAt: Date.now(),
        })
      },
    )

    return () => {
      unsubscribe()
      setState(s => ({ ...s, connected: false }))
    }
  }, [symbol])

  return state
}
