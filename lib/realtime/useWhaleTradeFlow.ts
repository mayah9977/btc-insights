'use client'

import { useEffect, useMemo, useState } from 'react'
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
  const { symbol = 'BTCUSDT', limit = 30 } = options
  const upper = symbol.toUpperCase()

  const [history, setHistory] = useState<WhaleTradeFlowPoint[]>([])

  useEffect(() => {
    const unsubscribe = subscribeWhaleTradeFlow(
      upper,
      (ratio, whaleVolume, totalVolume, ts) => {
        const rawTs = ts ?? Date.now()

        // 🔥 초 단위 정규화 (정렬 안정성)
        const normalizedTs = Math.floor(rawTs / 1000) * 1000

        setHistory(prev => {
          const existingIndex = prev.findIndex(
            p => p.ts === normalizedTs,
          )

          let next = [...prev]

          if (existingIndex >= 0) {
            // 🔥 같은 초면 update (push 금지)
            next[existingIndex] = {
              ts: normalizedTs,
              ratio,
              whaleVolume,
              totalVolume,
            }
          } else {
            next.push({
              ts: normalizedTs,
              ratio,
              whaleVolume,
              totalVolume,
            })
          }

          // 🔥 ts 기준 정렬 유지
          next.sort((a, b) => a.ts - b.ts)

          // 🔥 길이 제한
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
