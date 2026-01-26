'use client'

import { useEffect, useState } from 'react'
import {
  subscribeWhaleIntensity,
  subscribeWhaleWarning,
} from '@/lib/realtime/marketChannel'

export type WhaleIntensityPoint = {
  ts: number
  value: number
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

export function useWhaleIntensityHistory(
  options: Options = {},
) {
  const {
    symbol = 'BTCUSDT',
    limit = 30,
  } = options

  const upperSymbol = symbol.toUpperCase()

  const [history, setHistory] =
    useState<WhaleIntensityPoint[]>([])
  const [flagEvents, setFlagEvents] =
    useState<WhaleFlagEvent[]>([])
  const [initialized, setInitialized] =
    useState(false)

  /* =========================
   * 1️⃣ 초기 히스토리 fetch
   * ========================= */
  useEffect(() => {
    let cancelled = false
    setInitialized(false)

    fetch(
      `/api/market/whale-intensity?symbol=${upperSymbol}`,
    )
      .then(r => r.json())
      .then(d => {
        if (cancelled) return

        if (Array.isArray(d?.history)) {
          setHistory(
            d.history
              .slice(-limit)
              .map((v: number, i: number) => ({
                ts:
                  Date.now() -
                  (limit - i) * 1000,
                value: v,
              })),
          )
        } else {
          setHistory([])
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
   * 2️⃣ 실시간 구독 (SSE Manager)
   * ========================= */
  useEffect(() => {
    if (!initialized) return

    const unsubIntensity =
      subscribeWhaleIntensity(
        upperSymbol,
        (value, ts) => {
          setHistory(prev =>
            [
              ...prev,
              {
                ts: ts ?? Date.now(),
                value,
              },
            ].slice(-limit),
          )
        },
      )

    const unsubWarning =
      subscribeWhaleWarning(
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
  }, [upperSymbol, limit, initialized])

  return {
    history,
    flagEvents,
  }
}
