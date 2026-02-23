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

  /* =========================
   * 내부 상태
   * ========================= */
  const [displayValue, setDisplayValue] = useState(0)

  const targetValueRef = useRef(0)
  const displayValueRef = useRef(0) // ✅ interval에서 최신값 읽기용
  const velocityRef = useRef(0)

  const trendRef = useRef<'UP' | 'DOWN' | 'FLAT'>('FLAT')
  const spikeRef = useRef(false)

  /* =========================
   * 1️⃣ 초기 히스토리 fetch
   * ========================= */
  useEffect(() => {
    let cancelled = false
    setInitialized(false)

    fetch(`/api/market/whale-intensity?symbol=${upperSymbol}`)
      .then(r => r.json())
      .then(d => {
        if (cancelled) return

        if (Array.isArray(d?.history)) {
          const mapped = d.history.slice(-limit).map((v: number, i: number) => ({
            ts: Date.now() - (limit - i) * 1000,
            value: v,
            trend: 'FLAT',
            isSpike: false,
          }))

          setHistory(mapped)

          if (mapped.length > 0) {
            const last = mapped[mapped.length - 1].value
            targetValueRef.current = last
            displayValueRef.current = last
            setDisplayValue(last)
          }
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
   * 2️⃣ SSE 구독
   * ========================= */
  useEffect(() => {
    if (!initialized) return

    const unsubIntensity = subscribeWhaleIntensity(
      upperSymbol,
      (intensity, avg, trend, isSpike) => {
        targetValueRef.current = intensity
        trendRef.current = trend
        spikeRef.current = isSpike
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
  }, [upperSymbol, initialized])

  /* =========================
   * 3️⃣ RAF 보간 엔진 (1회만)
   * ========================= */
  useEffect(() => {
    let frame: number
    const stiffness = 0.15
    const damping = 0.85

    const animate = () => {
      setDisplayValue(prev => {
        const diff = targetValueRef.current - prev

        velocityRef.current =
          velocityRef.current * damping + diff * stiffness

        const next = prev + velocityRef.current

        // ✅ interval에서 최신값 사용
        displayValueRef.current = next

        return next
      })

      frame = requestAnimationFrame(animate)
    }

    frame = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(frame)
  }, [])

  /* =========================
   * 4️⃣ 시각화 히스토리 기록 (interval 1회만)
   * ========================= */
  useEffect(() => {
    const interval = setInterval(() => {
      setHistory(prev => {
        const last = prev[prev.length - 1]
        const dv = displayValueRef.current

        const previousValue = last?.value ?? dv
        const velocity = dv - previousValue

        const velocityBoost = velocity * 0.6
        const microNoise = (Math.random() - 0.5) * 0.012
        const wave = 0.008 * Math.sin(Date.now() / 280)
        const spikeBoost = spikeRef.current ? 0.02 : 0

        const visual = dv + velocityBoost + microNoise + wave + spikeBoost
        const clamped = Math.max(0, Math.min(1, visual))

        return [
          ...prev,
          {
            ts: Date.now(),
            value: clamped,
            trend: trendRef.current,
            isSpike: spikeRef.current,
          },
        ].slice(-limit)
      })
    }, 120)

    return () => clearInterval(interval)
  }, [limit]) // ✅ displayValue 제거 (핵심)

  return {
    history,
    flagEvents,
  }
}
