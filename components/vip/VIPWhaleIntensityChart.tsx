'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Area,
  AreaChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Scatter,
} from 'recharts'

import {
  useWhaleIntensityHistory,
  type WhaleIntensityPoint,
} from '@/lib/realtime/useWhaleIntensityHistory'

import { useRealtimeVolume } from '@/lib/realtime/useRealtimeVolume'
import { useRealtimeOI } from '@/lib/realtime/useRealtimeOI'
import { useLiveRiskState } from '@/lib/realtime/liveRiskState'

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'

type Props = {
  symbol?: string
  showTimeAxis?: boolean
  riskLevel?: RiskLevel
}

type FlagPoint = {
  ts: number
  value: number
  isSpike?: boolean
}

/* =========================
 * Tooltip
 * ========================= */
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: any[]
  label?: any
}) {
  if (!active || !payload?.length) return null

  const p0 = payload[0]?.payload as WhaleIntensityPoint

  const timeText =
    typeof label === 'number'
      ? new Date(label).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Asia/Seoul',
        })
      : ''

  return (
    <div className="rounded-md border border-zinc-700 bg-black/80 px-2 py-1 text-xs text-zinc-100 shadow-lg">
      {timeText && (
        <div className="text-zinc-300">{timeText}</div>
      )}

      {p0?.isSpike && (
        <div className="mt-0.5 font-semibold text-red-400 animate-pulse">
          🚨 고래 급변 감지
        </div>
      )}

      <div className="mt-0.5">
        강도:{' '}
        <span className="font-medium text-white">
          {Number.isFinite(p0?.value)
            ? p0.value.toFixed(2)
            : '--'}
        </span>
      </div>
    </div>
  )
}

export default function VIPWhaleIntensityChart({
  symbol = 'BTCUSDT',
  showTimeAxis = false,
  riskLevel,
}: Props) {
  useRealtimeVolume(symbol)
  useRealtimeOI(symbol)

  const { history } = useWhaleIntensityHistory({
    symbol,
    limit: 30,
  })

  const whalePulse =
    useLiveRiskState(s => s.state?.whalePulse) ?? false

  const latest = history.at(-1)

  const dynamicPulse =
    whalePulse ||
    (latest && latest.value >= 0.55) ||
    latest?.isSpike

  const flags: FlagPoint[] = useMemo(() => {
    return history
      .filter(p => p.isSpike)
      .map(p => ({
        ts: p.ts,
        value: p.value,
        isSpike: true,
      }))
  }, [history])

  const gradientId = 'whaleGradient'

  const strokeColor =
    latest?.trend === 'UP'
      ? '#ef4444'
      : '#f87171'

  const dynamicStrokeWidth =
    dynamicPulse ? 3.5 : 2.2

  return (
    <motion.div
      animate={{
        scale: dynamicPulse
          ? [1, 1.05, 1]
          : 1,
        filter: dynamicPulse
          ? [
              'brightness(1)',
              'brightness(1.25)',
              'brightness(1)',
            ]
          : 'brightness(1)',
      }}
      transition={{
        duration: 0.8,
        repeat: dynamicPulse ? Infinity : 0,
      }}
      className={`rounded-xl border p-4 ${
        dynamicPulse
          ? 'border-red-500 shadow-[0_0_28px_rgba(239,68,68,0.75)]'
          : 'border-vipBorder'
      } bg-vipCard`}
    >
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="text-sm font-medium text-white">
          고래 체결 강도
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-zinc-300">
            강도 {latest?.value?.toFixed(2) ?? '--'}
          </span>

          {riskLevel && (
            <span className="rounded-md px-2 py-1 bg-zinc-800 text-zinc-200">
              {riskLevel}
            </span>
          )}
        </div>
      </div>

      {!history.length ? (
        <div className="h-40 rounded-lg border border-zinc-800 bg-black/30" />
      ) : (
        <div className="h-40">
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={history}>
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
                    stopColor="#ef4444"
                    stopOpacity={0.75}
                  />
                  <stop
                    offset="95%"
                    stopColor="#ef4444"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <XAxis dataKey="ts" hide={!showTimeAxis} />

              {/* 🔥 동적 Y축 스케일 */}
              <YAxis
                domain={[
                  (min: number) =>
                    Math.max(0, min - 0.05),
                  (max: number) =>
                    max + 0.05,
                ]}
                hide
              />

              <Tooltip content={<CustomTooltip />} />

              <Area
                type="linear"
                dataKey="value"
                stroke={strokeColor}
                fill={`url(#${gradientId})`}
                strokeWidth={dynamicStrokeWidth}
                isAnimationActive={false}
              />

              <Line
                type="linear"
                dataKey="value"
                stroke={strokeColor}
                dot={false}
                strokeWidth={dynamicStrokeWidth}
                isAnimationActive={false}
              />

              <Scatter
                data={flags}
                dataKey="value"
                fill="#ff0000"
                shape="diamond"
              />

              <ReferenceLine
                y={0.55}
                stroke="rgba(250,204,21,0.8)"
                strokeDasharray="4 4"
              />

              <ReferenceLine
                y={0.7}
                stroke="rgba(239,68,68,1)"
                strokeDasharray="4 4"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div
        className={`mt-3 text-xs font-semibold text-center ${
          dynamicPulse
            ? 'text-red-400 animate-pulse'
            : 'text-emerald-400'
        }`}
      >
        {dynamicPulse
          ? '🔥 고래 압력 활성화'
          : '현재 실시간 고래체결강도를 측정중입니다.(We are currently measuring real-time whale transaction intensity.)'}
      </div>
    </motion.div>
  )
}
