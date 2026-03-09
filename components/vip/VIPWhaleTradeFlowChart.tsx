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

import { useWhaleTradeFlow } from '@/lib/realtime/useWhaleTradeFlow'
import { useWhaleNetPressure } from '@/lib/realtime/useWhaleNetPressure'
import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

import VIPWhaleTradeGuideCard from '@/components/vip/VIPWhaleTradeGuideCard'

/* ========================================================= */

function VIPWhaleTradeFlowChart({
  symbol = 'BTCUSDT',
}: {
  symbol?: string
}) {

  const { history } = useWhaleTradeFlow({ symbol, limit: 30 })

  const { history: netHistory } =
    useWhaleNetPressure({
      symbol,
      limit: 30,
    })

  /* ================= Store selectors ================= */

  const fmai = useVIPMarketStore(s => s.fmai)
  const absorption = useVIPMarketStore(s => s.absorption)
  const sweep = useVIPMarketStore(s => s.sweep)

  /* ================= Throttle Buffer ================= */

  const [bufferHistory, setBufferHistory] = useState<typeof history>([])
  const lastUpdateRef = useRef(0)

  useEffect(() => {

    if (!history?.length) return

    const now = Date.now()

    if (now - lastUpdateRef.current < 400) return

    lastUpdateRef.current = now

    setBufferHistory(history)

  }, [history])

  /* ========================================================= */

  const latest = bufferHistory.at(-1)
  const currentValue = latest?.ratio ?? 0

  const latestNet = netHistory.at(-1)
  const netValue = latestNet?.normalized ?? 0

  /* ================= Map optimization ================= */

  const netMap = useMemo(() => {

    const m = new Map<number, number>()

    netHistory.forEach(n => {
      m.set(n.ts, n.normalized)
    })

    return m

  }, [netHistory])

  /* ================= timestamp merge ================= */

  const merged = useMemo(() => {

    if (!bufferHistory.length) return []

    return bufferHistory.map(p => ({
      ...p,
      whaleNetRatio: netMap.get(p.ts) ?? 0,
      fmaiScore: fmai ?? 0,
      absorptionStrength: absorption ?? 0,
      sweepStrength: sweep ?? 0,
    }))

  }, [bufferHistory, netMap, fmai, absorption, sweep])

  /* ================= FMAI Weight ================= */

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

  /* ================= Scatter 제한 ================= */

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

  /* ========================================================= */

  const latestFiltered = filtered.at(-1)

  const dynamicPulse =
    Math.abs(latestFiltered?.weightedRatio ?? 0) > 0.2

  const institutionalDetected =
    Math.abs(latestFiltered?.weightedRatio ?? 0) > 0.25

  const absorptionDetected =
    (latestFiltered?.absorptionStrength ?? 0) > 0.6

  const sweepDetected =
    (latestFiltered?.sweepStrength ?? 0) > 0.6

  const netColor =
    netValue >= 0 ? '#22c55e' : '#3b82f6'

  const gradientId = 'tradeFlowGradient'

  /* ========================================================= */

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
            Institutional Flow (기관급 자금 흐름을 추정중입니다.)
          </div>

        </div>

        {institutionalDetected && (
          <div className="mb-1 text-xs text-red-400 font-semibold">
            🚨 Institutional Accumulation (기관급 고래의 거래 패턴이 감지된 상태입니다.)
          </div>
        )}

        {absorptionDetected && (
          <div className="mb-1 text-xs text-purple-400 font-semibold">
            🐳 Whale Absorption (세력이 물량을 받아먹거나 던지고 있는 흔적이 감지됩니다.)
          </div>
        )}

        {sweepDetected && (
          <div className="mb-2 text-xs text-cyan-400 font-semibold">
            ⚡ Liquidity Sweep (세력이 스탑 주문과 청산을 유도하기 위해 가격을 빠르게 밀어 유동성을 쓸어가는 움직임이 감지됩니다.)
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
