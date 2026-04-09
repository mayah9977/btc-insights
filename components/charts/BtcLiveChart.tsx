//components/charts/BtcLiveChart.tsx
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

const chartRef = useRef<any>(null)
const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null)
const ma20Ref = useRef<ISeriesApi<'Line'> | null>(null)
const ma60Ref = useRef<ISeriesApi<'Line'> | null>(null)

const wsRef = useRef<WebSocket | null>(null)
const reconnectRef = useRef<number | null>(null)

const pricesRef = useRef<number[]>([])
const lastTimeRef = useRef<number | null>(null)

const disposedRef = useRef(false)

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

disposedRef.current = false

if (wsRef.current) {
  wsRef.current.close()
  wsRef.current = null
}

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

chartRef.current = chart

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

pricesRef.current = []
lastTimeRef.current = null

;(async () => {

  const res = await fetch(
    `https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=${TF_MAP[tf]}&limit=200`
  )

  const klines: any[] = await res.json()

  const candles = klines.map(k => {

    const time = Math.floor(k[0] / 1000) as UTCTimestamp
    const t = Number(time)

    lastTimeRef.current = t

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

  for (let i = 0; i < candles.length; i++) {

    const time = candles[i].time

    if (i >= 19) {

      const slice20 = pricesRef.current.slice(i - 19, i + 1)
      const ma20v = slice20.reduce((a, b) => a + b, 0) / 20

      ma20.update({ time, value: ma20v })

    }

    if (i >= 59) {

      const slice60 = pricesRef.current.slice(i - 59, i + 1)
      const ma60v = slice60.reduce((a, b) => a + b, 0) / 60

      ma60.update({ time, value: ma60v })

    }

  }

})()

const connectWS = () => {

  if (disposedRef.current) return
  if (wsRef.current) return

  const ws = new WebSocket(
    `wss://fstream.binance.com/ws/btcusdt@kline_${TF_MAP[tf]}`
  )

  wsRef.current = ws

  ws.onmessage = e => {

    if (disposedRef.current) return

    const msg = JSON.parse(e.data)
    const k = msg.k

    if (!k || !candleRef.current) return

    const time = Math.floor(k.t / 1000) as UTCTimestamp
    const t = Number(time)

    if (lastTimeRef.current !== null && t < lastTimeRef.current) {
      return
    }

    lastTimeRef.current = t

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

    const len = pricesRef.current.length

    if (len >= 20) {

      const slice20 = pricesRef.current.slice(len - 20)
      const ma20v = slice20.reduce((a, b) => a + b, 0) / 20

      ma20Ref.current?.update({ time, value: ma20v })

    }

    if (len >= 60) {

      const slice60 = pricesRef.current.slice(len - 60)
      const ma60v = slice60.reduce((a, b) => a + b, 0) / 60

      ma60Ref.current?.update({ time, value: ma60v })

    }

  }

  ws.onclose = () => {

    wsRef.current = null

    if (disposedRef.current) return

    reconnectRef.current = window.setTimeout(() => {
      connectWS()
    }, 2000)

  }

  ws.onerror = () => {
    ws.close()
  }

}

connectWS()

const resize = () => {

  if (!containerRef.current || !chartRef.current) return

  chart.applyOptions({
    width: containerRef.current.clientWidth,
  })

}

window.addEventListener('resize', resize)

return () => {

  disposedRef.current = true

  window.removeEventListener('resize', resize)

  if (reconnectRef.current) {
    clearTimeout(reconnectRef.current)
  }

  if (wsRef.current) {
    wsRef.current.close()
    wsRef.current = null
  }

  if (chartRef.current) {
    chartRef.current.remove()
    chartRef.current = null
  }

}

}, [tf])

return ( <div className="relative w-full rounded-lg border border-zinc-800 bg-black p-3 overflow-hidden">

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

  </div>

  <div ref={containerRef} style={{ height: 380 }} />

</div>
)
}
