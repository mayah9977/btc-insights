'use client'

import { useEffect, useState } from 'react'
import { sseManager } from '@/lib/realtime/sseConnectionManager'
import { SSE_EVENT } from './types'

type FundingState = {
  fundingRate: number | null
  connected: boolean
  lastUpdatedAt: number | null
}

const INITIAL: FundingState = {
  fundingRate: null,
  connected: false,
  lastUpdatedAt: null,
}

export function useRealtimeFundingRate(symbol: string) {
  const [state, setState] = useState<FundingState>(INITIAL)

  useEffect(() => {
    if (!symbol) return

    const upper = symbol.toUpperCase()

    const unsubscribe = sseManager.subscribe(
      SSE_EVENT.FUNDING_RATE_TICK,
      (data: {
        symbol: string
        fundingRate: number
      }) => {
        if (data.symbol !== upper) return

        setState({
          fundingRate: data.fundingRate,
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
