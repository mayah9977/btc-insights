'use client'

import { useEffect, useMemo, useState } from 'react'
import { subscribeWhaleNetPressure } from '@/lib/realtime/marketChannel'

export type WhaleNetPressurePoint = {
  ts: number
  whaleBuyVolume: number
  whaleSellVolume: number
  whaleNetPressure: number      // 엔진 계산값 (-1 ~ 1)
  whaleNetRatio: number         // 엔진 계산값 (-1 ~ 1)
  normalized: number            // 차트 표시용 (-1 ~ 1)
  direction: 'BUY' | 'SELL' | 'NEUTRAL'
}

type Options = {
  symbol?: string
  limit?: number
}

export function useWhaleNetPressure(options: Options = {}) {
  const { symbol = 'BTCUSDT', limit = 60 } = options
  const upper = symbol.toUpperCase()

  const [history, setHistory] = useState<WhaleNetPressurePoint[]>([])

  useEffect(() => {
    const unsubscribe = subscribeWhaleNetPressure(
      upper,
      (
        whaleBuyVolume,
        whaleSellVolume,
        whaleNetPressure,
        whaleNetRatio,
        _totalVolume,
        ts,
      ) => {
        const rawTs = ts ?? Date.now()

        // 🔥 초 단위 정규화 (TradeFlow와 동일 기준)
        const normalizedTs = Math.floor(rawTs / 1000) * 1000

        const normalized = Math.max(
          -1,
          Math.min(1, whaleNetRatio ?? whaleNetPressure ?? 0),
        )

        let direction: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL'
        if (normalized > 0.05) direction = 'BUY'
        else if (normalized < -0.05) direction = 'SELL'

        setHistory(prev => {
          const existingIndex = prev.findIndex(
            p => p.ts === normalizedTs,
          )

          let next = [...prev]

          if (existingIndex >= 0) {
            // 🔥 같은 초면 update (push 금지)
            next[existingIndex] = {
              ts: normalizedTs,
              whaleBuyVolume,
              whaleSellVolume,
              whaleNetPressure,
              whaleNetRatio,
              normalized,
              direction,
            }
          } else {
            next.push({
              ts: normalizedTs,
              whaleBuyVolume,
              whaleSellVolume,
              whaleNetPressure,
              whaleNetRatio,
              normalized,
              direction,
            })
          }

          // 🔥 항상 시간순 정렬
          next.sort((a, b) => a.ts - b.ts)

          return next.slice(-limit)
        })
      },
    )

    return () => unsubscribe()
  }, [upper, limit])

  /* =========================
     통계 계산
  ========================= */

  const stats = useMemo(() => {
    if (!history.length) {
      return {
        latest: null,
        avg: 0,
        buyDominance: false,
        sellDominance: false,
      }
    }

    const values = history.map(p => p.normalized)

    const avg =
      values.reduce((a, b) => a + b, 0) / values.length

    const latest = history[history.length - 1]

    return {
      latest,
      avg,
      buyDominance: avg > 0.1,
      sellDominance: avg < -0.1,
    }
  }, [history])

  return {
    history,
    latest: stats.latest,
    averagePressure: stats.avg,
    buyDominance: stats.buyDominance,
    sellDominance: stats.sellDominance,
  }
}
