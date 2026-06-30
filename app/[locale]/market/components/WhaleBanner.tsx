'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  calcWhaleIntensity,
  type WhaleIntensity,
} from '../lib/ai/calcWhaleIntensity'
import { useWhaleTrigger } from '../lib/whaleTriggerStore'
import { useRealtimeMarket } from '@/lib/realtime/useRealtimeMarket'

type BannerState = {
  symbol: string
  intensity: WhaleIntensity
  oiDelta: number
  volumeDelta: number
  updatedAt: number
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export default function WhaleBanner() {
  const symbol = useMemo(
    () =>
      (
        process.env.NEXT_PUBLIC_BINANCE_SYMBOL ??
        'BTCUSDT'
      ).toUpperCase(),
    []
  )

  const { whaleActive, triggerWhale } =
    useWhaleTrigger()

  // ✅ SSE 기반 실시간 데이터
  const { openInterest } = useRealtimeMarket()

  const [state, setState] =
    useState<BannerState | null>(null)

  /** refs */
  const prevOIRef = useRef<number | null>(null)
  const tradesRef = useRef<
    Array<{ t: number; q: number }>
  >([])
  const volumeEmaRef = useRef<number>(0)
  const cooldownRef = useRef<number>(0)

  useEffect(() => {
    if (openInterest == null) return

    const prevOI = prevOIRef.current
    prevOIRef.current = openInterest
    const oiDelta =
      prevOI == null ? 0 : openInterest - prevOI

    const arr = tradesRef.current
    const vol60s = arr.reduce(
      (sum, x) => sum + x.q,
      0
    )

    if (volumeEmaRef.current <= 0) {
      volumeEmaRef.current = vol60s
    } else {
      volumeEmaRef.current =
        volumeEmaRef.current * 0.9 +
        vol60s * 0.1
    }

    const baseline = Math.max(
      1,
      volumeEmaRef.current
    )
    const volumeDelta = clamp(
      vol60s / baseline,
      0,
      50
    )

    const intensity = calcWhaleIntensity({
      oiDelta: Math.abs(oiDelta),
      volumeDelta,
    })

    const now = Date.now()

    if (
      intensity === 'HIGH' &&
      now > cooldownRef.current
    ) {
      cooldownRef.current = now + 6000
      triggerWhale()
    }

    setState({
      symbol,
      intensity,
      oiDelta,
      volumeDelta,
      updatedAt: now,
    })
  }, [openInterest, symbol, triggerWhale])

  /** 거래량 WebSocket (유지) */
  useEffect(() => {
    const ws = new WebSocket(
      `wss://fstream.binance.com/ws/${symbol.toLowerCase()}@aggTrade`
    )

    ws.onmessage = ev => {
      try {
        const msg = JSON.parse(ev.data)
        const p = Number(msg?.p ?? 0)
        const qBase = Number(msg?.q ?? 0)
        if (!Number.isFinite(p) || !Number.isFinite(qBase))
          return

        const quoteVol = p * qBase
        const now = Date.now()

        const arr = tradesRef.current
        arr.push({ t: now, q: quoteVol })

        const cutoff = now - 60_000
        while (arr.length && arr[0].t < cutoff)
          arr.shift()
      } catch {}
    }

    return () => {
      try {
        ws.close()
      } catch {}
    }
  }, [symbol])

  const show =
    state &&
    (whaleActive || state.intensity === 'HIGH')

  if (!show || !state) return null

  const isHigh = state.intensity === 'HIGH'

  return (
    <div
      className={[
        'w-full rounded-xl px-4 py-3 border',
        'bg-neutral-950 text-white transition-all',
        isHigh
          ? 'border-yellow-400 animate-pulse'
          : 'border-neutral-700',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className={isHigh ? 'animate-pulse' : ''}>
            🐋
          </span>
          <div className="font-bold">
            Whale Activity:{' '}
            <span
              className={
                isHigh
                  ? 'text-yellow-300'
                  : 'text-white'
              }
            >
              {state.intensity}
            </span>
          </div>
        </div>

        <div className="text-xs opacity-80">
          {state.symbol} | OI Δ{' '}
          {state.oiDelta.toFixed(2)} | Vol x{' '}
          {state.volumeDelta.toFixed(2)}
        </div>
      </div>

      <div className="mt-2 text-sm opacity-90">
        {isHigh
          ? 'Mass trading detected — stay sharp.'
          : 'Whale heat rising...'}
      </div>
    </div>
  )
}
