'use client'

import { useEffect, useRef, useState } from 'react'
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  ISeriesApi,
  UTCTimestamp,
} from 'lightweight-charts'
import { useRealtimeVolume } from '@/lib/realtime/useRealtimeVolume'

type TF = '1m' | '5m' | '15m'
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'

type Props = {
  riskLevel: RiskLevel
}

const TF_MAP: Record<TF, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
}

export default function BtcLiveChart({ riskLevel }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  // 🔥 v5 올바른 타입 방식
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const ma20Ref = useRef<ISeriesApi<'Line'> | null>(null)
  const ma60Ref = useRef<ISeriesApi<'Line'> | null>(null)

  const lastTimeRef = useRef<number | null>(null)
  const pricesRef = useRef<number[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  const [tf, setTf] = useState<TF>('1m')

  const { volume, connected } = useRealtimeVolume('BTCUSDT')

  const formatVolume = (v: number) =>
    v >= 1_000_000
      ? `$${(v / 1_000_000).toFixed(2)}M`
      : v >= 1_000
      ? `$${(v / 1_000).toFixed(1)}K`
      : `$${Math.round(v).toLocaleString()}`

  useEffect(() => {
    if (!containerRef.current) return

    const width = containerRef.current.clientWidth
    if (width <= 0) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#000000' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      width,
      height: 380,
      timeScale: { timeVisible: true },
    })

    // 🔥 v5 addSeries 방식 유지
    const candle = chart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
      borderVisible: false,
    })

    const ma20 = chart.addSeries(LineSeries, {
      color: '#facc15',
      lineWidth: 1,
    })

    const ma60 = chart.addSeries(LineSeries, {
      color: '#60a5fa',
      lineWidth: 1,
    })

    candleRef.current = candle
    ma20Ref.current = ma20
    ma60Ref.current = ma60

    lastTimeRef.current = null
    pricesRef.current = []

    /* =========================
       초기 데이터
    ========================= */
    ;(async () => {
      const res = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${TF_MAP[tf]}&limit=120`
      )
      const klines: any[] = await res.json()

      const candles = klines.map(k => {
        const time = (k[0] / 1000) as UTCTimestamp
        lastTimeRef.current = k[0] / 1000

        const close = Number(k[4])
        pricesRef.current.push(close)

        return {
          time,
          open: Number(k[1]),
          high: Number(k[2]),
          low: Number(k[3]),
          close,
        }
      })

      candle.setData(candles)

      const calcMA = (arr: number[], n: number) =>
        arr.length >= n
          ? arr.slice(-n).reduce((a, b) => a + b, 0) / n
          : null

      candles.forEach(c => {
        const ma20v = calcMA(pricesRef.current, 20)
        const ma60v = calcMA(pricesRef.current, 60)

        if (ma20v != null)
          ma20.update({ time: c.time, value: ma20v })
        if (ma60v != null)
          ma60.update({ time: c.time, value: ma60v })
      })
    })()

    /* =========================
       WebSocket
    ========================= */
    const ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/btcusdt@kline_${TF_MAP[tf]}`
    )

    ws.onmessage = e => {
      const msg = JSON.parse(e.data)
      const k = msg.k
      if (!k || !candleRef.current) return

      const timeSec = k.t / 1000

      if (
        lastTimeRef.current !== null &&
        timeSec < lastTimeRef.current
      ) return

      lastTimeRef.current = timeSec

      const time = timeSec as UTCTimestamp
      const close = Number(k.c)

      pricesRef.current.push(close)
      if (pricesRef.current.length > 300)
        pricesRef.current.shift()

      candleRef.current.update({
        time,
        open: Number(k.o),
        high: Number(k.h),
        low: Number(k.l),
        close,
      })

      const calcMA = (arr: number[], n: number) =>
        arr.length >= n
          ? arr.slice(-n).reduce((a, b) => a + b, 0) / n
          : null

      const ma20v = calcMA(pricesRef.current, 20)
      const ma60v = calcMA(pricesRef.current, 60)

      if (ma20v != null)
        ma20Ref.current?.update({ time, value: ma20v })
      if (ma60v != null)
        ma60Ref.current?.update({ time, value: ma60v })
    }

    wsRef.current = ws

    const resize = () => {
      if (!containerRef.current) return
      chart.applyOptions({
        width: containerRef.current.clientWidth,
      })
    }

    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
      ws.close()
      chart.remove()
    }
  }, [tf])

  return (
    <div className="relative w-full rounded-lg border border-zinc-800 bg-black p-3 overflow-hidden">
      {riskLevel === 'EXTREME' && (
        <div className="pointer-events-none absolute inset-0 z-10 bg-red-900/15 animate-pulse" />
      )}

      <div className="relative z-20 flex items-center justify-between mb-2">
        <div className="flex gap-2">
          {(['1m', '5m', '15m'] as TF[]).map(t => (
            <button
              key={t}
              onClick={() => setTf(t)}
              className={`px-3 py-1 text-sm rounded ${
                tf === t
                  ? 'bg-red-600 text-white'
                  : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="text-xs text-zinc-300">
          Volume:{' '}
          {connected && volume != null
            ? formatVolume(volume)
            : '--'}
        </div>
      </div>

      <div ref={containerRef} style={{ height: 380 }} />
    </div>
  )
}
