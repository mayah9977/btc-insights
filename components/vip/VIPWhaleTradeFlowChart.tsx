'use client'

import React, { useMemo, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  ReferenceLine,
  Scatter,
} from 'recharts'

import { useWhaleNetPressure } from '@/lib/realtime/useWhaleNetPressure'
import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

import VIPWhaleTradeGuideCard from '@/components/vip/VIPWhaleTradeGuideCard'
import { chartRealtimeBridge } from '@/lib/chart/chartRealtimeBridge'

type TradePoint = {
  ts: number
  ratio: number
  whaleVolume: number
  totalVolume: number
}

const BUFFER_SIZE = 30
const RENDER_INTERVAL = 120

function VIPWhaleTradeFlowChart({
  symbol = 'BTCUSDT',
}: {
  symbol?: string
}) {

  const { history: netHistory } =
    useWhaleNetPressure({
      symbol,
      limit: 30,
    })

  const fmai = useVIPMarketStore(s => s.fmai)
  const absorption = useVIPMarketStore(s => s.absorption)
  const sweep = useVIPMarketStore(s => s.sweep)

  const chartBufferRef = useRef<TradePoint[]>([])
  const historyIndexRef = useRef(0)

  const [history, setHistory] = useState<TradePoint[]>([])

  const lastRenderRef = useRef(0)

  /* =========================
     chartRealtimeBridge register
  ========================= */

  useEffect(() => {

    chartRealtimeBridge.register(
      'whaleTradeFlow_desktop',
      (point: TradePoint) => {

        const buffer = chartBufferRef.current

        if (buffer.length < BUFFER_SIZE) {
          buffer.push(point)
        } else {
          buffer.shift()
          buffer.push(point)
        }

        const now = performance.now()

        if (now - lastRenderRef.current > RENDER_INTERVAL) {
          setHistory([...buffer])
          lastRenderRef.current = now
        }

      }
    )

    return () => {
      chartRealtimeBridge.unregister('whaleTradeFlow_desktop')
    }

  }, [])

  /* =========================
     Net Map
  ========================= */

  const netMap = useMemo(() => {

    const m = new Map<number, number>()

    netHistory.forEach(n => {
      m.set(n.ts, n.normalized)
    })

    return m

  }, [netHistory])

  /* =========================
     merge
  ========================= */

  const merged = useMemo(() => {

    if (!history.length) return []

    return history.map(p => ({
      ...p,
      whaleNetRatio: netMap.get(p.ts) ?? 0,
      fmaiScore: fmai ?? 0,
      absorptionStrength: absorption ?? 0,
      sweepStrength: sweep ?? 0,
    }))

  }, [history, netMap, fmai, absorption, sweep])

  /* =========================
     FMAI Weight
  ========================= */

  const fmaiThreshold = 0.35

  const filtered = useMemo(() => {

    if (!merged.length) return []

    return merged.map(p => {

      const score = p.fmaiScore ?? 0

      if (Math.abs(score) >= fmaiThreshold) {
        return {
          ...p,
          weightedRatio: p.ratio * Math.abs(score),
        }
      }

      return {
        ...p,
        weightedRatio: 0,
      }

    })

  }, [merged])

  /* =========================
     Scatter flags
  ========================= */

  const institutionalFlags = useMemo(() => {

    return filtered
      .filter(p => Math.abs(p.weightedRatio ?? 0) > 0.2)
      .slice(-5)

  }, [filtered])

  const absorptionFlags = useMemo(() => {

    return filtered
      .filter(p => (p.absorptionStrength ?? 0) > 0.6)
      .slice(-5)

  }, [filtered])

  const sweepFlags = useMemo(() => {

    return filtered
      .filter(p => (p.sweepStrength ?? 0) > 0.6)
      .slice(-5)

  }, [filtered])

  const latest = filtered.at(-1)

  const currentValue = latest?.ratio ?? 0

  const latestNet = netHistory.at(-1)
  const netValue = latestNet?.normalized ?? 0

  const dynamicPulse =
    Math.abs(latest?.weightedRatio ?? 0) > 0.2

  const institutionalDetected =
    Math.abs(latest?.weightedRatio ?? 0) > 0.25

  const absorptionDetected =
    (latest?.absorptionStrength ?? 0) > 0.6

  const sweepDetected =
    (latest?.sweepStrength ?? 0) > 0.6

  const netColor =
    netValue >= 0 ? '#22c55e' : '#3b82f6'

  const gradientId = 'tradeFlowGradient'

  return (
    <>

      <motion.div
        animate={dynamicPulse ? { scale: [1, 1.05, 1] } : { scale: 1 }}
        transition={{
          duration: 0.8,
          repeat: dynamicPulse ? 2 : 0,
        }}
        className="rounded-xl border border-vipBorder bg-vipCard p-4"
      >

        <div className="mb-2 flex items-center justify-between">

          <div className="text-sm font-medium text-white">
            🐋 큰고래 자금 흐름 분석
          </div>

          <div className="text-xs text-zinc-300 text-right">
            Institutional Flow
          </div>

        </div>

        {institutionalDetected && (
          <div className="mb-1 text-xs text-red-400 font-semibold">
            🚨 Institutional Accumulation
          </div>
        )}

        {absorptionDetected && (
          <div className="mb-1 text-xs text-purple-400 font-semibold">
            🐳 Whale Absorption
          </div>
        )}

        {sweepDetected && (
          <div className="mb-2 text-xs text-cyan-400 font-semibold">
            ⚡ Liquidity Sweep
          </div>
        )}

        <div className="h-[160px] w-full min-w-0">

          <ResponsiveContainer width="100%" height="100%">

            <AreaChart data={filtered}>

              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff0000" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ff0000" stopOpacity={0}/>
                </linearGradient>
              </defs>

              <XAxis dataKey="ts" hide />
              <YAxis hide />

              <ReferenceLine
                y={0}
                stroke="rgba(255,255,255,0.4)"
                strokeDasharray="3 3"
              />

              <Area
                type="monotone"
                dataKey="weightedRatio"
                stroke="#ff0000"
                fill={`url(#${gradientId})`}
                strokeWidth={3}
                isAnimationActive={false}
              />

              <Line
                type="monotone"
                dataKey="ratio"
                stroke="#facc15"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />

              <Line
                type="monotone"
                dataKey="whaleNetRatio"
                stroke={netColor}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />

              <Scatter
                data={institutionalFlags}
                dataKey="weightedRatio"
                fill="#ff0000"
              />

              <Scatter
                data={absorptionFlags}
                dataKey="ratio"
                fill="#a855f7"
              />

              <Scatter
                data={sweepFlags}
                dataKey="ratio"
                fill="#06b6d4"
              />

            </AreaChart>

          </ResponsiveContainer>

        </div>

      </motion.div>

      <VIPWhaleTradeGuideCard
        ratio={currentValue}
        net={netValue}
      />

    </>
  )
}

export default React.memo(VIPWhaleTradeFlowChart)
