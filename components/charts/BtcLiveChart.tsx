'use client'

import { useEffect, useRef, useState } from 'react'
import {
  createChart,
  Time,
  CandlestickSeries,
  LineSeries,
  ISeriesApi,
} from 'lightweight-charts'

import { useRealtimeVolume } from '@/lib/realtime/useRealtimeVolume'

type TF = '1m' | '5m' | '15m'

const KST_OFFSET = 9 * 60 * 60 // seconds

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'

type Props = {
  riskLevel: RiskLevel
}

/* 캔들 타입 */
type CandlePoint = {
  time: Time
  open: number
  high: number
  low: number
  close: number
}

const TF_MAP: Record<TF, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
}

export default function BtcLiveChart({ riskLevel }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const ma20Ref = useRef<ISeriesApi<'Line'> | null>(null)
  const ma60Ref = useRef<ISeriesApi<'Line'> | null>(null)

  const pricesRef = useRef<number[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  const [tf, setTf] = useState<TF>('1m')

  /* Realtime Volume */
  const { volume, connected } = useRealtimeVolume('BTCUSDT')

  const formatVolume = (v: number) =>
    v >= 1_000_000
      ? `$${(v / 1_000_000).toFixed(2)}M`
      : v >= 1_000
      ? `$${(v / 1_000).toFixed(1)}K`
      : `$${Math.round(v).toLocaleString()}`

  useEffect(() => {
    if (!containerRef.current) return

    /* =========================
       Chart Init
    ========================= */
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: '#000000' },
        textColor: '#d1d5db',
      },
      grid: {
        vertLines: { color: '#1f2937' },
        horzLines: { color: '#1f2937' },
      },
      width: containerRef.current.clientWidth,
      height: 380,
      timeScale: { timeVisible: true },
    })

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

    /* =========================
       1️⃣ 초기 캔들 (REST)
    ========================= */
    ;(async () => {
      const res = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${TF_MAP[tf]}&limit=120`,
      )
      const klines: any[] = await res.json()

      pricesRef.current = []

      const candles: CandlePoint[] = klines.map(k => {
        const close = Number(k[4])
        pricesRef.current.push(close)

        return {
          time: ((k[0] / 1000) + KST_OFFSET) as Time,
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

      candles.forEach((c, i) => {
        const slice = pricesRef.current.slice(0, i + 1)
        const ma20v = calcMA(slice, 20)
        const ma60v = calcMA(slice, 60)
        if (ma20v) ma20.update({ time: c.time, value: ma20v })
        if (ma60v) ma60.update({ time: c.time, value: ma60v })
      })
    })()

    /* =========================
       2️⃣ WebSocket (kline)
    ========================= */
    const ws = new WebSocket(
      `wss://stream.binance.com:9443/ws/btcusdt@kline_${TF_MAP[tf]}`,
    )

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data)
      const k = msg.k
      if (!k || !candleRef.current) return

      const close = Number(k.c)
      pricesRef.current.push(close)

      const point: CandlePoint = {
        time: (k.t / 1000 + KST_OFFSET) as Time,
        open: Number(k.o),
        high: Number(k.h),
        low: Number(k.l),
        close,
      }

      candleRef.current.update(point)

      const calcMA = (arr: number[], n: number) =>
        arr.length >= n
          ? arr.slice(-n).reduce((a, b) => a + b, 0) / n
          : null

      const ma20v = calcMA(pricesRef.current, 20)
      const ma60v = calcMA(pricesRef.current, 60)

      if (ma20v) ma20Ref.current?.update({ time: point.time, value: ma20v })
      if (ma60v) ma60Ref.current?.update({ time: point.time, value: ma60v })
    }

    wsRef.current = ws

    const resize = () => {
      chart.applyOptions({
        width: containerRef.current!.clientWidth,
      })
    }

    window.addEventListener('resize', resize)

    return () => {
      window.removeEventListener('resize', resize)
      wsRef.current?.close()
      chart.remove()
      pricesRef.current = []
    }
  }, [tf])

  return (
    <div className="relative w-full rounded-lg border border-zinc-800 bg-black p-3 overflow-hidden">
      {riskLevel === 'EXTREME' && (
        <div className="pointer-events-none absolute inset-0 z-10 bg-red-900/15 animate-pulse" />
      )}

      {/* 상단 컨트롤 + Volume */}
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
          {connected && volume !== null
            ? formatVolume(volume)
            : '--'}
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative z-20"
        style={{ height: 380 }}
      />
    </div>
  )
}
