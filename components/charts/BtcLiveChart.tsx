'use client'

import { useEffect, useRef, useState } from 'react'
import {
  createChart,
  Time,
  CandlestickSeries,
  LineSeries,
  ISeriesApi,
} from 'lightweight-charts'

type TF = '1m' | '5m' | '15m'

/* ✅ KST 보정 (UTC +9) */
const KST_OFFSET = 9 * 60 * 60 // seconds

export type ExtremeZone = {
  startTime: number
  endTime: number
  price: number
}

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'

type Props = {
  riskLevel: RiskLevel
  onExtremeDetected?: (zones: ExtremeZone[]) => void
  onPriceUpdate?: (price: number) => void
}

/* ✅ 캔들 타입 명시 */
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

export default function BtcLiveChart({
  riskLevel,
  onExtremeDetected,
  onPriceUpdate,
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
  const ma20Ref = useRef<ISeriesApi<'Line'> | null>(null)
  const ma60Ref = useRef<ISeriesApi<'Line'> | null>(null)

  const pricesRef = useRef<number[]>([])
  const extremeZonesRef = useRef<ExtremeZone[]>([])
  const activeExtremeRef = useRef<ExtremeZone | null>(null)

  const [tf, setTf] = useState<TF>('1m')

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

    let ws: WebSocket | null = null

    /* =========================
       1️⃣ REST: 초기 캔들 로딩 (KST)
    ========================= */
    ;(async () => {
      const res = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=${TF_MAP[tf]}&limit=120`,
      )
      const klines: any[] = await res.json()

      pricesRef.current = []

      const candles: CandlePoint[] = klines.map((k: any): CandlePoint => {
        const close = Number(k[4])
        pricesRef.current.push(close)

        return {
          time: ((k[0] / 1000) + KST_OFFSET) as Time, // ✅ KST
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

      candles.forEach((c: CandlePoint, i: number) => {
        const slice = pricesRef.current.slice(0, i + 1)
        const ma20v = calcMA(slice, 20)
        const ma60v = calcMA(slice, 60)

        if (ma20v) ma20.update({ time: c.time, value: ma20v })
        if (ma60v) ma60.update({ time: c.time, value: ma60v })
      })

      onPriceUpdate?.(pricesRef.current.at(-1)!)

      /* =========================
         2️⃣ WS: append 전용 (KST)
      ========================= */
      ws = new WebSocket(
        `wss://stream.binance.com:9443/ws/btcusdt@kline_${TF_MAP[tf]}`,
      )

      ws.onmessage = (event) => {
        const d = JSON.parse(event.data)
        const k = d.k
        if (!k?.x) return // 확정 캔들만

        const close = Number(k.c)
        const time = ((k.t / 1000) + KST_OFFSET) as Time // ✅ KST

        pricesRef.current.push(close)
        if (pricesRef.current.length > 200) {
          pricesRef.current.shift()
        }

        candle.update({
          time,
          open: Number(k.o),
          high: Number(k.h),
          low: Number(k.l),
          close,
        })

        const ma20v = calcMA(pricesRef.current, 20)
        const ma60v = calcMA(pricesRef.current, 60)

        if (ma20v) ma20.update({ time, value: ma20v })
        if (ma60v) ma60.update({ time, value: ma60v })

        onPriceUpdate?.(close)
      }
    })()

    const resize = () => {
      chart.applyOptions({
        width: containerRef.current!.clientWidth,
      })
    }

    window.addEventListener('resize', resize)

    return () => {
      ws?.close()
      window.removeEventListener('resize', resize)
      chart.remove()
      pricesRef.current = []
      extremeZonesRef.current = []
      activeExtremeRef.current = null
    }
  }, [tf, onExtremeDetected, onPriceUpdate])

  return (
    <div className="relative w-full rounded-lg border border-zinc-800 bg-black p-3 overflow-hidden">
      {riskLevel === 'EXTREME' && (
        <div className="pointer-events-none absolute inset-0 z-10 bg-red-900/15 animate-pulse" />
      )}

      <div className="relative z-20 flex gap-2 mb-2">
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

      <div
        ref={containerRef}
        className="relative z-20"
        style={{ height: 380 }}
      />
    </div>
  )
}
