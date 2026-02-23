'use client'

import { useEffect, useMemo, useState } from 'react'
import { subscribeWhaleTradeFlow } from '@/lib/realtime/marketChannel'

export type WhaleTradeFlowPoint = {
  ts: number
  ratio: number
  whaleVolume: number
  totalVolume: number
  isSpike?: boolean
  visualRatio?: number // 🔥 추가 (빌드에러 해결)
}

type Options = {
  symbol?: string
  limit?: number
}

export function useWhaleTradeFlow(options: Options = {}) {
  const { symbol = 'BTCUSDT', limit = 30 } = options
  const upper = symbol.toUpperCase()

  const [history, setHistory] = useState<WhaleTradeFlowPoint[]>([])

  useEffect(() => {
    const unsubscribe = subscribeWhaleTradeFlow(
      upper,
      (ratio, whaleVolume, totalVolume, ts) => {
        setHistory(prev => {
          const next: WhaleTradeFlowPoint[] = [
            ...prev,
            {
              ts: ts ?? Date.now(),
              ratio,
              whaleVolume,
              totalVolume,
            },
          ].slice(-limit)

          return next
        })
      },
    )

    return () => unsubscribe()
  }, [upper, limit])

  /* =========================
   🔥 Spike 계산 (최근 평균 대비 1.8배)
  ========================= */

  const enhancedHistory = useMemo(() => {
    if (history.length < 10) return history

    const avg =
      history.reduce((a, b) => a + b.ratio, 0) /
      history.length

    return history.map(point => ({
      ...point,
      isSpike: point.ratio > avg * 1.8,
    }))
  }, [history])

  return { history: enhancedHistory }
}
