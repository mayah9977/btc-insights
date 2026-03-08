'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { subscribeWhaleTradeFlow } from '@/lib/realtime/marketChannel'

export type WhaleTradeFlowPoint = {
  ts: number
  ratio: number
  whaleVolume: number
  totalVolume: number
  isSpike?: boolean
}

type Options = {
  symbol?: string
  limit?: number
}

export function useWhaleTradeFlow(options: Options = {}) {

  const { symbol = 'BTCUSDT', limit = 30 }
    = options

  const upper = symbol.toUpperCase()

  const [history, setHistory] = useState<WhaleTradeFlowPoint[]>([])

  /* ===============================
     realtime throttling
  =============================== */

  const lastUpdateRef = useRef(0)

  useEffect(() => {

    const unsubscribe = subscribeWhaleTradeFlow(
      upper,
      (ratio, whaleVolume, totalVolume, ts) => {

        const now = Date.now()

        /* 🔥 200ms throttling */
        if (now - lastUpdateRef.current < 200) return

        lastUpdateRef.current = now

        const rawTs = ts ?? now

        /* 🔥 초 단위 정규화 */
        const normalizedTs =
          Math.floor(rawTs / 1000) * 1000

        setHistory(prev => {

          const existingIndex =
            prev.findIndex(p => p.ts === normalizedTs)

          let next = [...prev]

          if (existingIndex >= 0) {

            /* 같은 초 → update */
            next[existingIndex] = {
              ts: normalizedTs,
              ratio,
              whaleVolume,
              totalVolume,
            }

          } else {

            /* 새 데이터 push */
            next.push({
              ts: normalizedTs,
              ratio,
              whaleVolume,
              totalVolume,
            })

          }

          /* 🔥 sort 제거 (시간은 항상 증가) */
          return next.slice(-limit)

        })

      },
    )

    return () => unsubscribe()

  }, [upper, limit])

  /* =====================================================
     Spike 계산 (최근 평균 대비 1.8배)
  ===================================================== */

  const enhancedHistory = useMemo(() => {

    if (history.length < 10)
      return history

    const avg =
      history.reduce((a, b) => a + b.ratio, 0)
      / history.length

    return history.map(point => ({
      ...point,
      isSpike: point.ratio > avg * 1.8,
    }))

  }, [history])

  return {
    history: enhancedHistory,
  }

}
