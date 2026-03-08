'use client'

import { useEffect } from 'react'
import {
  scheduleMasterMarketUpdate
} from '@/lib/market/store/masterMarketStore'

import { sseManager } from '@/lib/realtime/sseConnectionManager'

export function useMasterMarketStream(symbol: string) {

  useEffect(() => {

    if (!symbol) return

    const upper = symbol.toUpperCase()

    /* ================= FINAL_DECISION ================= */

    const unsubDecision = sseManager.subscribe(
      'FINAL_DECISION',
      (data: any) => {

        if (!data || data.symbol?.toUpperCase() !== upper) return

        scheduleMasterMarketUpdate({
          symbol: upper,
          decision: data.decision,
          dominant: data.dominant,
          confidence: data.confidence,
        })

      },
    )

    /* ================= MARKET_STATE ================= */

    const unsubMarketState = sseManager.subscribe(
      'MARKET_STATE',
      (data: any) => {

        if (!data || data.symbol?.toUpperCase() !== upper) return

        scheduleMasterMarketUpdate({
          actionGate: data.actionGateState,
          macd: data.macd ?? null,
        })

      },
    )

    return () => {

      unsubDecision()
      unsubMarketState()

    }

  }, [symbol])

}
