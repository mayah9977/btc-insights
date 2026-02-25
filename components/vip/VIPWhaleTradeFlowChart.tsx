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
  ReferenceDot,
  ReferenceLine,
  Scatter,
} from 'recharts'
import { useMemo } from 'react'
import { useWhaleTradeFlow } from '@/lib/realtime/useWhaleTradeFlow'
import { useLiveRiskState } from '@/lib/realtime/liveRiskState'

export default function VIPWhaleTradeFlowChart({
  symbol = 'BTCUSDT',
}: {
  symbol?: string
}) {
  const { history } = useWhaleTradeFlow({ symbol, limit: 30 })
  const whalePulse =
    useLiveRiskState(s => s.state?.whalePulse) ?? false

  const latest = history.at(-1)
  const currentValue = latest?.ratio ?? 0

  const whaleMode =
    whalePulse && currentValue >= 0.55

  /* =========================
   🔥 1️⃣ MICRO WAVE LAYER
  ========================= */

  const visualHistory = useMemo(() => {
    if (whaleMode) return history

    return history.map((p, i) => {
      const wave =
        0.004 *
        Math.sin(Date.now() / 400 + i * 0.6)

      const noise =
        (Math.random() - 0.5) * 0.002

      return {
        ...p,
        visualRatio: Math.max(
          0,
          Math.min(1, p.ratio + wave + noise),
        ),
      }
    })
  }, [history, whaleMode])

  /* =========================
   🔥 축 계산
  ========================= */

  const { minY, maxY } = useMemo(() => {
    if (!visualHistory.length)
      return { minY: 0, maxY: 1 }

    const values = visualHistory.map(
      p => p.visualRatio ?? p.ratio,
    )

    const min = Math.min(...values)
    const max = Math.max(...values)

    const range = max - min
    const safeRange =
      range < 0.05 ? 0.05 : range

    const padding = safeRange * 0.4

    return {
      minY: Math.max(0, min - padding),
      maxY: Math.min(1, max + padding),
    }
  }, [visualHistory])

  const dynamicPulse =
    whaleMode || currentValue >= 0.6

  const strokeColor =
    whaleMode
      ? '#ff0000'
      : currentValue > 0.55
      ? '#ef4444'
      : '#facc15'

  const dynamicStrokeWidth =
    whaleMode ? 4.5 : dynamicPulse ? 3.2 : 2

  /* =========================
   🔥 3️⃣ LIGHT SCATTER
  ========================= */

  const idleScatter = useMemo(() => {
    if (whaleMode) return []

    return visualHistory.map(p => ({
      ts: p.ts,
      ratio: p.visualRatio ?? p.ratio,
    }))
  }, [visualHistory, whaleMode])

  const gradientId = 'tradeFlowGradient'

  return (
    <motion.div
      animate={
        whaleMode
          ? { scale: [1, 1.08, 1] }
          : dynamicPulse
          ? { scale: [1, 1.04, 1] }
          : { scale: 1 }
      }
      transition={{
        duration: 0.8,
        repeat:
          whaleMode || dynamicPulse
            ? Infinity
            : 0,
      }}
      className="rounded-xl border border-vipBorder bg-vipCard p-4"
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium text-white">
          Large Whale Detection System (AI가 큰고래(200k이상)의 움직임을 감지중입니다.) 
        </div>
        <div className="text-xs text-zinc-300">
          {(currentValue * 100).toFixed(2)}%
        </div>
      </div>

      <div className="h-40 min-h-[160px] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={visualHistory}>
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
                  stopColor={strokeColor}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={strokeColor}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <XAxis dataKey="ts" hide />
            <YAxis domain={[minY, maxY]} hide />

            <Tooltip
              formatter={(value: any) =>
                `${(value * 100).toFixed(2)}%`
              }
            />

            <ReferenceLine
              y={0.55}
              stroke="rgba(250,204,21,0.6)"
              strokeDasharray="4 4"
            />
            <ReferenceLine
              y={0.7}
              stroke="rgba(239,68,68,0.8)"
              strokeDasharray="4 4"
            />

            {/* 🔥 Area */}
            <Area
              type="monotone"
              dataKey={
                whaleMode
                  ? 'ratio'
                  : 'visualRatio'
              }
              stroke={strokeColor}
              fill={`url(#${gradientId})`}
              strokeWidth={dynamicStrokeWidth}
              isAnimationActive={false}
            />

            {/* 🔥 Idle Light Scatter */}
            {!whaleMode && (
              <Scatter
                data={idleScatter}
                dataKey="ratio"
                fill="rgba(255,0,0,0.4)"
                shape="diamond"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 text-xs text-center text-emerald-400">
        {whaleMode
          ? '💀 WHALE MODE ACTIVATED'
          : 'AI가 실시간으로 큰고래 체결을 감지 중입니다. ( AI is detecting large whale transactions in real time. )'}
      </div>
    </motion.div>
  )
}
