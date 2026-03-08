'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { subscribeWhaleNetPressure } from '@/lib/realtime/marketChannel'

export type WhaleNetPressurePoint = {
  ts: number
  whaleBuyVolume: number
  whaleSellVolume: number
  whaleNetPressure: number
  whaleNetRatio: number
  normalized: number
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

  /* 🔥 realtime throttling */
  const lastUpdateRef = useRef(0)

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

        const now = Date.now()

        /* 🔥 200ms throttling */
        if (now - lastUpdateRef.current < 200) return
        lastUpdateRef.current = now

        const rawTs = ts ?? now

        /* 🔥 초 단위 정규화 */
        const normalizedTs = Math.floor(rawTs / 1000) * 1000

        const normalized = Math.max(
          -1,
          Math.min(1, whaleNetRatio ?? whaleNetPressure ?? 0),
        )

        let direction: 'BUY' | 'SELL' | 'NEUTRAL' = 'NEUTRAL'

        if (normalized > 0.05) direction = 'BUY'
        else if (normalized < -0.05) direction = 'SELL'

        setHistory(prev => {

          const existingIndex =
            prev.findIndex(p => p.ts === normalizedTs)

          let next = [...prev]

          if (existingIndex >= 0) {

            /* 같은 초면 update */
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

            /* 새 데이터 push */
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

          /* 🔥 sort 제거 (시간 증가 보장) */
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
