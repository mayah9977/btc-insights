// components/charts/BtcLiveChart.tsx
// Source: :contentReference[oaicite:0]{index=0}

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
import { sseManager } from '@/lib/realtime/sseConnectionManager'
import { SSE_EVENT } from '@/lib/realtime/types'

type TF = '1m' | '5m' | '15m'

export type RiskLevel =
  | 'LOW'
  | 'MEDIUM'
  | 'HIGH'
  | 'EXTREME'

type Props = {
  riskLevel: RiskLevel
}

type LiveCandle = {
  time: UTCTimestamp
  open: number
  high: number
  low: number
  close: number
}

type PriceTickPayload = {
  type?: string
  symbol?: string
  price?: number
  ts?: number
}

const TF_MAP: Record<TF, string> = {
  '1m': '1m',
  '5m': '5m',
  '15m': '15m',
}

const TF_SECONDS: Record<TF, number> = {
  '1m': 60,
  '5m': 300,
  '15m': 900,
}

export default function BtcLiveChart({
  riskLevel,
}: Props) {
  const containerRef =
    useRef<HTMLDivElement | null>(null)

  const chartRef = useRef<any>(null)

  const candleRef =
    useRef<
      ISeriesApi<'Candlestick'> | null
    >(null)

  const ma20Ref =
    useRef<ISeriesApi<'Line'> | null>(
      null,
    )

  const ma60Ref =
    useRef<ISeriesApi<'Line'> | null>(
      null,
    )

  /**
   * 기존 reconnect 구조 유지.
   * Binance websocket 제거 이후에도
   * SSE reconnect/cleanup 안정화를 위해 유지합니다.
   */
  const reconnectRef =
    useRef<number | null>(null)

  const pricesRef = useRef<number[]>([])

  const lastTimeRef =
    useRef<number | null>(null)

  const liveCandleRef =
    useRef<LiveCandle | null>(null)

  const disposedRef = useRef(false)

  const sseUnsubscribeRef =
    useRef<(() => void) | null>(null)

  const [tf, setTf] = useState<TF>('1m')

  const { volume, connected } =
    useRealtimeVolume('BTCUSDT')

  const formatVolume = (v: number) =>
    v >= 1_000_000
      ? `$${(v / 1_000_000).toFixed(2)}M`
      : v >= 1_000
        ? `$${(v / 1_000).toFixed(1)}K`
        : `$${Math.round(v).toLocaleString()}`

  useEffect(() => {
    if (!containerRef.current) return

    disposedRef.current = false

    /**
     * reconnect timer cleanup 유지.
     * StrictMode/HMR에서 중복 reconnect 방지.
     */
    if (reconnectRef.current) {
      clearTimeout(reconnectRef.current)
      reconnectRef.current = null
    }

    /**
     * 기존 SSE subscription cleanup.
     * HMR/StrictMode에서 duplicate subscribe 방지.
     */
    if (sseUnsubscribeRef.current) {
      sseUnsubscribeRef.current()
      sseUnsubscribeRef.current = null
    }

    const chart = createChart(
      containerRef.current,
      {
        layout: {
          background: {
            color: '#000000',
          },
          textColor: '#d1d5db',
        },
        grid: {
          vertLines: {
            color: '#1f2937',
          },
          horzLines: {
            color: '#1f2937',
          },
        },
        width:
          containerRef.current.clientWidth,
        height: 380,
        timeScale: {
          timeVisible: true,
        },
      },
    )

    chartRef.current = chart

    const candle = chart.addSeries(
      CandlestickSeries,
      {
        upColor: '#26a69a',
        downColor: '#ef5350',
        wickUpColor: '#26a69a',
        wickDownColor: '#ef5350',
        borderVisible: false,
      },
    )

    const ma20 = chart.addSeries(
      LineSeries,
      {
        color: '#facc15',
        lineWidth: 1,
      },
    )

    const ma60 = chart.addSeries(
      LineSeries,
      {
        color: '#60a5fa',
        lineWidth: 1,
      },
    )

    candleRef.current = candle
    ma20Ref.current = ma20
    ma60Ref.current = ma60

    pricesRef.current = []
    lastTimeRef.current = null
    liveCandleRef.current = null

    const updateMovingAverages = (
      time: UTCTimestamp,
    ) => {
      const len =
        pricesRef.current.length

      if (len >= 20) {
        const slice20 =
          pricesRef.current.slice(
            len - 20,
          )

        const ma20v =
          slice20.reduce(
            (a, b) => a + b,
            0,
          ) / 20

        ma20Ref.current?.update({
          time,
          value: ma20v,
        })
      }

      if (len >= 60) {
        const slice60 =
          pricesRef.current.slice(
            len - 60,
          )

        const ma60v =
          slice60.reduce(
            (a, b) => a + b,
            0,
          ) / 60

        ma60Ref.current?.update({
          time,
          value: ma60v,
        })
      }
    }

    /**
     * 핵심 실시간 차트 업데이트 로직.
     * Binance websocket 제거 후에도
     * SSE PRICE_TICK만으로 실시간 캔들 생성 유지.
     */
    const updateChartFromPrice = ({
      price,
      ts,
      source,
    }: {
      price: number
      ts?: number
      source: 'SSE_PRICE_TICK'
    }) => {
      if (disposedRef.current) return

      if (!candleRef.current) {
        console.warn(
          '[BTC_CHART] seriesRef missing, update skipped',
          {
            source,
            hasCandleRef:
              Boolean(candleRef.current),
            hasChartRef:
              Boolean(chartRef.current),
          },
        )

        return
      }

      const rawTimestamp =
        typeof ts === 'number' && ts > 0
          ? ts
          : Date.now()

      const seconds =
        rawTimestamp > 10_000_000_000
          ? Math.floor(rawTimestamp / 1000)
          : Math.floor(rawTimestamp)

      const bucket =
        Math.floor(seconds / TF_SECONDS[tf]) *
        TF_SECONDS[tf]

      const time = bucket as UTCTimestamp

      const lastCandle =
        liveCandleRef.current

      let nextCandle: LiveCandle

      /**
       * 동일 캔들 bucket이면 update,
       * 새 bucket이면 신규 candle 생성.
       */
      if (
        lastCandle &&
        Number(lastCandle.time) === bucket
      ) {
        nextCandle = {
          time,
          open: lastCandle.open,
          high: Math.max(
            lastCandle.high,
            price,
          ),
          low: Math.min(
            lastCandle.low,
            price,
          ),
          close: price,
        }

        if (pricesRef.current.length > 0) {
          pricesRef.current[
            pricesRef.current.length - 1
          ] = price
        } else {
          pricesRef.current.push(price)
        }
      } else {
        nextCandle = {
          time,
          open:
            lastCandle?.close ?? price,
          high: price,
          low: price,
          close: price,
        }

        pricesRef.current.push(price)
      }

      if (
        pricesRef.current.length > 300
      ) {
        pricesRef.current.shift()
      }

      liveCandleRef.current = nextCandle
      lastTimeRef.current = bucket

      /**
       * lightweight-charts 실시간 update 유지.
       */
      candleRef.current.update(nextCandle)

      /**
       * 초당 반복 tick debug log 제거.
       * 실시간 chart update 로직은 그대로 유지합니다.
       */

      updateMovingAverages(time)
    }

    /**
     * 초기 historical candles fetch 유지.
     */
    ;(async () => {
      try {
        const res = await fetch(
          `https://fapi.binance.com/fapi/v1/klines?symbol=BTCUSDT&interval=${TF_MAP[tf]}&limit=200`,
        )

        const klines: any[] =
          await res.json()

        if (disposedRef.current) {
          return
        }

        const candles = klines.map((k) => {
          const time = Math.floor(
            k[0] / 1000,
          ) as UTCTimestamp

          const t = Number(time)

          lastTimeRef.current = t

          const close = Number(k[4])

          pricesRef.current.push(close)

          const candleData: LiveCandle = {
            time,
            open: Number(k[1]),
            high: Number(k[2]),
            low: Number(k[3]),
            close,
          }

          liveCandleRef.current = candleData

          return candleData
        })

        candle.setData(candles)

        for (
          let i = 0;
          i < candles.length;
          i++
        ) {
          const time = candles[i].time

          if (i >= 19) {
            const slice20 =
              pricesRef.current.slice(
                i - 19,
                i + 1,
              )

            const ma20v =
              slice20.reduce(
                (a, b) => a + b,
                0,
              ) / 20

            ma20.update({
              time,
              value: ma20v,
            })
          }

          if (i >= 59) {
            const slice60 =
              pricesRef.current.slice(
                i - 59,
                i + 1,
              )

            const ma60v =
              slice60.reduce(
                (a, b) => a + b,
                0,
              ) / 60

            ma60.update({
              time,
              value: ma60v,
            })
          }
        }

        console.log(
          '[BTC_CHART] initial candles loaded',
          {
            tf,
            count: candles.length,
            lastTime: lastTimeRef.current,
            hasSeries:
              Boolean(candleRef.current),
          },
        )
      } catch (error) {
        console.error(
          '[BTC_CHART] initial fetch failed',
          error,
        )
      }
    })()

    /**
     * 핵심:
     * Redis → SSE → PRICE_TICK fanout 기반 실시간 구독.
     * 초당 반복 PRICE_TICK debug log만 제거하고,
     * subscription 구조는 그대로 유지합니다.
     */
    sseUnsubscribeRef.current =
      sseManager.subscribe(
        SSE_EVENT.PRICE_TICK,
        (msg: PriceTickPayload) => {
          if (disposedRef.current) return

          if (
            msg?.symbol?.toUpperCase() !==
            'BTCUSDT'
          ) {
            return
          }

          const price = Number(msg.price)

          if (!Number.isFinite(price)) {
            console.warn(
              '[BTC_CHART] PRICE_TICK invalid price',
              msg,
            )

            return
          }

          updateChartFromPrice({
            price,
            ts: msg.ts,
            source: 'SSE_PRICE_TICK',
          })
        },
      )

    console.log(
      '[BTC_CHART] PRICE_TICK subscribed',
      {
        tf,
        event: SSE_EVENT.PRICE_TICK,
      },
    )

    /**
     * resize 유지.
     */
    const resize = () => {
      if (
        !containerRef.current ||
        !chartRef.current
      ) {
        return
      }

      chart.applyOptions({
        width:
          containerRef.current
            .clientWidth,
      })
    }

    window.addEventListener(
      'resize',
      resize,
    )

    return () => {
      disposedRef.current = true

      window.removeEventListener(
        'resize',
        resize,
      )

      /**
       * SSE cleanup 유지.
       */
      if (sseUnsubscribeRef.current) {
        console.log(
          '[BTC_CHART] PRICE_TICK unsubscribe',
          {
            tf,
          },
        )

        sseUnsubscribeRef.current()
        sseUnsubscribeRef.current = null
      }

      /**
       * reconnect timer cleanup 유지.
       */
      if (reconnectRef.current) {
        clearTimeout(
          reconnectRef.current,
        )

        reconnectRef.current = null
      }

      /**
       * chart cleanup 유지.
       */
      if (chartRef.current) {
        chartRef.current.remove()
        chartRef.current = null
      }

      candleRef.current = null
      ma20Ref.current = null
      ma60Ref.current = null
      liveCandleRef.current = null
    }
  }, [tf])

  return (
    <div className="relative w-full rounded-lg border border-zinc-800 bg-black p-3 overflow-hidden">
      {riskLevel === 'EXTREME' && (
        <div className="pointer-events-none absolute inset-0 z-10 bg-red-900/15 animate-pulse" />
      )}

      <div className="relative z-20 flex items-center justify-between mb-2">
        <div className="flex gap-2">
          {(
            ['1m', '5m', '15m'] as TF[]
          ).map((t) => (
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

      <div
        ref={containerRef}
        style={{ height: 380 }}
      />
    </div>
  )
}
