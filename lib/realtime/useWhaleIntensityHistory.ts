'use client'

import { useEffect, useRef, useState } from 'react'
import {
  subscribeWhaleIntensity,
  subscribeWhaleWarning,
} from '@/lib/realtime/marketChannel'

export type WhaleIntensityPoint = {
  ts: number
  value: number
  trend?: 'UP' | 'DOWN' | 'FLAT'
  isSpike?: boolean
}

export type WhaleFlagEvent = {
  ts: number
  value: number
  avg: number
}

type Options = {
  symbol?: string
  limit?: number
}

export function useWhaleIntensityHistory(options: Options = {}) {
  const { symbol = 'BTCUSDT', limit = 30 } = options
  const upperSymbol = symbol.toUpperCase()

  const [history, setHistory] = useState<WhaleIntensityPoint[]>([])
  const [flagEvents, setFlagEvents] = useState<WhaleFlagEvent[]>([])
  const [initialized, setInitialized] = useState(false)

  const trendRef = useRef<'UP' | 'DOWN' | 'FLAT'>('FLAT')
  const spikeRef = useRef(false)

  /* =========================
   1️⃣ 초기 히스토리 fetch
  ========================= */
  useEffect(() => {
    let cancelled = false
    setInitialized(false)

    fetch(`/api/market/whale-intensity?symbol=${upperSymbol}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return

        if (Array.isArray(d?.history)) {
          const mapped = d.history.slice(-limit).map(
            (v: number, i: number) => ({
              ts: Date.now() - (limit - i) * 1000,
              value: Math.max(0, Math.min(1, v)),
              trend: 'FLAT',
              isSpike: false,
            }),
          )

          setHistory(mapped)
        }

        setFlagEvents([])
        setInitialized(true)
      })
      .catch(() => {
        setInitialized(true)
      })

    return () => {
      cancelled = true
    }
  }, [upperSymbol, limit])

  /* =========================
   2️⃣ SSE 구독 (엔진 값 직접 반영)
  ========================= */
  useEffect(() => {
    if (!initialized) return

    const unsubIntensity = subscribeWhaleIntensity(
      upperSymbol,
      (intensity, avg, trend, isSpike, ts) => {
        const timestamp = ts ?? Date.now()

        const clamped = Math.max(0, Math.min(1, intensity))

        trendRef.current = trend
        spikeRef.current = isSpike

        setHistory(prev =>
          [
            ...prev,
            {
              ts: timestamp,
              value: clamped, // 🔥 엔진값 그대로
              trend,
              isSpike,
            },
          ].slice(-limit),
        )
      },
    )

    const unsubWarning = subscribeWhaleWarning(
      upperSymbol,
      (value, avg, ts) => {
        setFlagEvents(prev =>
          [
            ...prev,
            {
              ts: ts ?? Date.now(),
              value,
              avg,
            },
          ].slice(-10),
        )
      },
    )

    return () => {
      unsubIntensity()
      unsubWarning()
    }
  }, [upperSymbol, initialized, limit])

  return {
    history,
    flagEvents,
  }
}
