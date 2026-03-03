'use client'

import { motion } from 'framer-motion'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
  Scatter,
} from 'recharts'
import { useMemo, useEffect, useState } from 'react'
import { useWhaleTradeFlow } from '@/lib/realtime/useWhaleTradeFlow'
import { useWhaleNetPressure } from '@/lib/realtime/useWhaleNetPressure'
import { subscribeVIPChannel } from '@/lib/realtime/marketChannel'
import VIPWhaleTradeGuideCard from '@/components/vip/VIPWhaleTradeGuideCard'

type FMAIPoint = {
  ts: number
  score: number
}

export default function VIPWhaleTradeFlowChart({
  symbol = 'BTCUSDT',
}: {
  symbol?: string
}) {
  const { history } = useWhaleTradeFlow({ symbol, limit: 30 })
  const { history: netHistory } = useWhaleNetPressure({
    symbol,
    limit: 30,
  })

  const [fmaiHistory, setFmaiHistory] = useState<FMAIPoint[]>([])

  /* =========================
     FMAI 구독
  ========================= */
  useEffect(() => {
    const unsub = subscribeVIPChannel(symbol, (event: any) => {
      if (event.type !== 'FMAI') return

      setFmaiHistory(prev =>
        [...prev, { ts: event.ts, score: event.score }].slice(-50),
      )
    })

    return () => unsub()
  }, [symbol])

  const latest = history.at(-1)
  const currentValue = latest?.ratio ?? 0

  const latestNet = netHistory.at(-1)
  const netValue = latestNet?.normalized ?? 0

  /* =========================
     timestamp merge
  ========================= */

  const merged = useMemo(() => {
    if (!history.length) return []

    const netMap = new Map<number, number>()
    netHistory.forEach(n => netMap.set(n.ts, n.normalized))

    const fmaiMap = new Map<number, number>()
    fmaiHistory.forEach(f => fmaiMap.set(f.ts, f.score))

    return history.map(p => {
      const net =
        netMap.get(p.ts) ??
        netHistory.find(n => Math.abs(n.ts - p.ts) <= 1000)
          ?.normalized ??
        0

      const fmaiScore =
        fmaiMap.get(p.ts) ??
        fmaiHistory.find(f => Math.abs(f.ts - p.ts) <= 1000)
          ?.score ??
        0

      return {
        ...p,
        whaleNetRatio: net,
        fmaiScore,
      }
    })
  }, [history, netHistory, fmaiHistory])

  /* =========================
     🔥 FMAI 강한 정렬만 표시
  ========================= */

  const fmaiThreshold = 0.35

  const filtered = useMemo(() => {
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

  /* ========================= */

  const dynamicPulse = Math.abs(filtered.at(-1)?.weightedRatio ?? 0) > 0.2

  const ratioColor =
    dynamicPulse ? '#ff0000' : '#facc15'

  const netColor =
    netValue >= 0 ? '#22c55e' : '#3b82f6'

  const gradientId = 'tradeFlowGradient'

  return (
    <>
      <motion.div
        animate={
          dynamicPulse
            ? { scale: [1, 1.05, 1] }
            : { scale: 1 }
        }
        transition={{
          duration: 0.8,
          repeat: dynamicPulse ? Infinity : 0,
        }}
        className="rounded-xl border border-vipBorder bg-vipCard p-4"
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="text-sm font-medium text-white">
            🐋 큰고래 (200k이상) 자금 흐름 분석 (AI is currently under observation.)
          </div>

          <div className="text-xs text-zinc-300 text-right">
            큰고래 체결강도 분석중
          </div>
        </div>

        <div className="h-40 min-h-[160px] min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filtered}>
              <defs>
                <linearGradient
                  id={gradientId}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={ratioColor}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={ratioColor}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <XAxis dataKey="ts" hide />
              <YAxis hide />

              <Tooltip
                formatter={(value: any) =>
                  `${(value * 100).toFixed(2)}%`
                }
              />

              <ReferenceLine
                y={0}
                stroke="rgba(255,255,255,0.4)"
                strokeDasharray="3 3"
              />

              {/* 🔥 weightedRatio 사용 */}
              <Area
                type="monotone"
                dataKey="weightedRatio"
                stroke={ratioColor}
                fill={`url(#${gradientId})`}
                strokeWidth={3}
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
                data={filtered.filter(
                  p => Math.abs(p.weightedRatio) > 0.2,
                )}
                dataKey="weightedRatio"
                fill={ratioColor}
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
