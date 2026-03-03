'use client'

import { useEffect } from 'react'
import { useMasterMarketStore } from '@/lib/market/store/masterMarketStore'
import { sseManager } from '@/lib/realtime/sseConnectionManager'

export function useMasterMarketStream(symbol: string) {
  const update = useMasterMarketStore((s) => s.update)

  useEffect(() => {
    if (!symbol) return

    const upper = symbol.toUpperCase()

    console.log('[MASTER STREAM] mounted for', upper)

    /* ================= FINAL_DECISION ================= */

    const unsubDecision = sseManager.subscribe(
      'FINAL_DECISION',
      (data: any) => {
        if (!data || data.symbol?.toUpperCase() !== upper) return

        console.log('[MASTER STREAM] FINAL_DECISION received', data)

        console.log('[MASTER STREAM] calling update() for FINAL_DECISION')

        update({
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

        console.log('[MASTER STREAM] MARKET_STATE received', data)

        console.log('[MASTER STREAM] calling update() for MARKET_STATE')

        update({
          actionGate: data.actionGateState,
          macd: data.macd ?? null,
        })
      },
    )

    return () => {
      console.log('[MASTER STREAM] unmounted for', upper)
      unsubDecision()
      unsubMarketState()
    }
  }, [symbol, update])
}
