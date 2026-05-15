// lib/realtime/useRealtimeMarketComposite.ts

'use client'

import { useEffect, useRef, useState } from 'react'

import {
  subscribeOpenInterest,
  subscribeMarketVolume,
  subscribeWhaleIntensity,
} from '@/lib/realtime/marketChannel'

type CompositeState = {
  oi: number | null
  oiDelta: number | null
  oiDirection: 'UP' | 'DOWN' | 'FLAT' | null

  volume: number | null

  /**
   * 🔥 whaleIntensity SSOT = 0~100
   */
  whaleIntensity: number | null

  /**
   * 🔥 whaleAvg SSOT = 0~100
   */
  whaleAvg: number | null

  whaleTrend: 'UP' | 'DOWN' | 'FLAT' | null
  whaleSpike: boolean

  funding: number | null // (현재 SSE에 funding subscribe 없으면 null 유지)

  connected: boolean
  lastUpdatedAt: number | null
}

const INITIAL: CompositeState = {
  oi: null,
  oiDelta: null,
  oiDirection: null,

  volume: null,

  whaleIntensity: null,
  whaleAvg: null,
  whaleTrend: null,
  whaleSpike: false,

  funding: null,

  connected: false,
  lastUpdatedAt: null,
}

/* =========================================================
   🔥 whaleIntensity SSOT normalize utility
   - legacy 0~1 자동 승격
   - 0~100 clamp
========================================================= */

function normalizeWhaleIntensityScale(
  value: unknown,
): number | null {
  const n = Number(value)

  if (!Number.isFinite(n)) {
    return null
  }

  /**
   * legacy 0~1 payload
   * ex:
   * 0.72 -> 72
   * 0.91 -> 91
   */
  if (n <= 1) {
    return Math.max(
      0,
      Math.min(100, n * 100),
    )
  }

  /**
   * already 0~100 scale
   */
  return Math.max(
    0,
    Math.min(100, n),
  )
}

export function useRealtimeMarketComposite(
  symbol: string,
) {
  const [state, setState] =
    useState<CompositeState>(INITIAL)

  // 연결 상태 추적용
  const connectionRef = useRef(false)

  useEffect(() => {
    if (!symbol) return

    const upper = symbol.toUpperCase()

    /* =========================
       OI
    ========================= */

    const unsubOI = subscribeOpenInterest(
      upper,
      (
        openInterest,
        delta,
        direction,
        ts,
      ) => {
        connectionRef.current = true

        setState((prev) => ({
          ...prev,
          oi: openInterest,
          oiDelta: delta,
          oiDirection: direction,
          connected: true,
          lastUpdatedAt:
            ts ?? Date.now(),
        }))
      },
    )

    /* =========================
       Volume
    ========================= */

    const unsubVol = subscribeMarketVolume(
      upper,
      (volume, ts) => {
        connectionRef.current = true

        setState((prev) => ({
          ...prev,
          volume,
          connected: true,
          lastUpdatedAt:
            ts ?? Date.now(),
        }))
      },
    )

    /* =========================
       Whale Intensity
    ========================= */

    const unsubWhale =
      subscribeWhaleIntensity(
        upper,
        (
          intensity,
          avg,
          trend,
          isSpike,
          ts,
        ) => {
          connectionRef.current = true

          /**
           * 🔥 whaleIntensity SSOT = 0~100
           *
           * legacy 0~1 payload 자동 승격
           * 이미 0~100이면 그대로 유지
           */
          const normalizedIntensity =
            normalizeWhaleIntensityScale(
              intensity,
            )

          /**
           * 🔥 whaleAvg SSOT = 0~100
           *
           * Redis history legacy 값 자동 승격
           */
          const normalizedAvg =
            normalizeWhaleIntensityScale(
              avg,
            )

          setState((prev) => ({
            ...prev,

            whaleIntensity:
              normalizedIntensity,

            whaleAvg: normalizedAvg,

            whaleTrend: trend,
            whaleSpike: isSpike,

            connected: true,

            lastUpdatedAt:
              ts ?? Date.now(),
          }))
        },
      )

    return () => {
      unsubOI()
      unsubVol()
      unsubWhale()

      setState((prev) => ({
        ...prev,
        connected: false,
      }))
    }
  }, [symbol])

  return state
}
