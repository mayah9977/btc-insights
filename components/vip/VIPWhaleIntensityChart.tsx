'use client'
import { useMemo, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
} from '@/lib/realtime/useWhaleIntensityHistory'

import { useRealtimeVolume } from '@/lib/realtime/useRealtimeVolume'
import { useRealtimeOI } from '@/lib/realtime/useRealtimeOI'
import { useWhaleNetPressure } from '@/lib/realtime/useWhaleNetPressure'

import {
  calculateInstitutionalProbability,
} from '@/lib/market/institutionalProbability'

import VIPInstitutionalGuideCard from '@/components/vip/VIPInstitutionalGuideCard'
import { useConfirmedInstitutionalSignal } from '@/lib/engine/useConfirmedInstitutionalSignal'
import { subscribeVIPChannel } from '@/lib/realtime/marketChannel'

type Props = {
  symbol?: string
  showTimeAxis?: boolean
}

type FMAIPoint = {
  ts: number
  score: number
}

export default function VIPWhaleIntensityChart({
  symbol = 'BTCUSDT',
  showTimeAxis = false,
}: Props) {

  useRealtimeVolume(symbol)

  const { delta: oiDelta } = useRealtimeOI(symbol)
  const { history } = useWhaleIntensityHistory({
    symbol,
    limit: 30,
  })

  const { latest: netLatest } =
    useWhaleNetPressure({ symbol, limit: 30 })

  const [fmaiHistory, setFmaiHistory] = useState<FMAIPoint[]>([])

  /* ================= FMAI 구독 ================= */
  useEffect(() => {
    const unsub = subscribeVIPChannel(symbol, (event: any) => {
      if (event.type !== 'FMAI') return
      setFmaiHistory(prev =>
        [...prev, { ts: event.ts, score: event.score }].slice(-50),
      )
    })
    return () => unsub()
  }, [symbol])

  /* ================= FMAI 병합 ================= */
  const mergedHistory = useMemo(() => {
    if (!history.length) return []
    const fmaiMap = new Map<number, number>()
    fmaiHistory.forEach(f => fmaiMap.set(f.ts, f.score))

    return history.map(p => {
      const score =
        fmaiMap.get(p.ts) ??
        fmaiHistory.find(f => Math.abs(f.ts - p.ts) <= 1000)?.score ??
        0

      return {
        ...p,
        fmaiScore: score,
      }
    })
  }, [history, fmaiHistory])

  /* ================= 약한 정렬만 표시 ================= */
  const fmaiThreshold = 0.35

  const filteredHistory = useMemo(() => {
    return mergedHistory.map(p => {
      const score = p.fmaiScore ?? 0
      if (Math.abs(score) < fmaiThreshold) return p
      return { ...p, value: 0 }
    })
  }, [mergedHistory])

  const latest = filteredHistory.at(-1)

  const whalePulse = latest?.isSpike ?? false
  const netValue = netLatest?.normalized ?? 0
  const currentValue = latest?.value ?? 0

  const probability =
    calculateInstitutionalProbability({
      whaleRatio: currentValue,
      netRatio: netValue,
      oiDelta,
      isSpike: whalePulse,
    })

  const {
    longProbability,
    shortProbability,
    confidence: rawConfidence,
    dominant: rawDominant,
  } = probability

  const {
    confirmedDominant,
    confirmedConfidence,
    isPending,
  } = useConfirmedInstitutionalSignal({
    rawDominant,
    rawConfidence,
  })

  const displayDominant = confirmedDominant
  const displayConfidence = confirmedConfidence

  const confidenceColor =
    displayConfidence >= 45
      ? displayDominant === 'LONG'
        ? '#10b981'
        : '#3b82f6'
      : displayConfidence >= 25
      ? '#facc15'
      : '#6b7280'

  const strongSignal = displayConfidence >= 45

  const flags = useMemo(() => {
    return filteredHistory
      .filter(p => p.isSpike)
      .map(p => ({
        ts: p.ts,
        value: p.value,
      }))
  }, [filteredHistory])

  /* =====================================================
     렌더
  ===================================================== */

  return (
    <>
      <motion.div
        animate={
          strongSignal
            ? { scale: [1, 1.03, 1] }
            : { scale: 1 }
        }
        transition={{
          duration: 0.8,
          repeat: strongSignal ? Infinity : 0,
        }}
        className="rounded-xl border p-5 relative bg-vipCard overflow-hidden"
        style={{
          borderColor: confidenceColor,
          boxShadow: `0 0 30px ${confidenceColor}55`,
        }}
      >

        {/* 스캔 라인 효과 */}
        <motion.div
          initial={{ x: '-100%' }}
          animate={{ x: '120%' }}
          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
          className="absolute top-0 left-0 w-1/3 h-full pointer-events-none"
          style={{
            background:
              'linear-gradient(120deg, transparent, rgba(255,255,255,0.05), transparent)',
          }}
        />

        <div className="mb-3">
          <div className="text-sm font-semibold text-white">
            기관 자금 방향 분석
          </div>
          <div className="text-xs text-neutral-400">
            기관급 고래체결강도 구간표시
          </div>
        </div>

        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={filteredHistory}>
              <defs>
                <linearGradient id="intensityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>

              <XAxis dataKey="ts" hide={!showTimeAxis} />
              <YAxis hide />
              <Tooltip />

              <Area
                type="monotone"
                dataKey="value"
                stroke="#ff4444"
                fill="url(#intensityGradient)"
                strokeWidth={3}
                isAnimationActive={false}
              />

              <Line
                type="monotone"
                dataKey="value"
                stroke="#ff4444"
                dot={false}
                strokeWidth={2}
                isAnimationActive={false}
              />

              <Scatter
                data={flags}
                dataKey="value"
                fill="#ff0000"
                shape="circle"
              />

              <ReferenceLine
                y={0.55}
                stroke="rgba(250,204,21,0.8)"
                strokeDasharray="4 4"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 최근 포인트 강조 */}
        <AnimatePresence>
          {latest && (
            <motion.div
              key={latest.ts}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 1.2, repeat: Infinity }}
              className="absolute bottom-0 left-0 w-full h-2 pointer-events-none"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(255,0,0,0.3), transparent)',
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>

      <VIPInstitutionalGuideCard
        long={longProbability}
        short={shortProbability}
        confidence={displayConfidence}
        dominant={displayDominant}
      />
    </>
  )
}
