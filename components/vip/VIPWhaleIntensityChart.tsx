'use client'

import React, { useMemo, useEffect, useState, useRef } from 'react'
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

import { useRealtimeOI } from '@/lib/realtime/useRealtimeOI'
import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'
import { calculateInstitutionalProbability } from '@/lib/market/institutionalProbability'
import VIPInstitutionalGuideCard from '@/components/vip/VIPInstitutionalGuideCard'
import { useConfirmedInstitutionalSignal } from '@/lib/engine/useConfirmedInstitutionalSignal'

import { chartController } from '@/lib/chart/chartController'

type Props = {
  symbol?: string
  showTimeAxis?: boolean
}

type HistoryPoint = {
  ts: number
  value: number
  fmaiScore: number
  whaleNetRatio: number
  isSpike: boolean
}

const BUFFER_SIZE = 60

function VIPWhaleIntensityChart({
  symbol = 'BTCUSDT',
  showTimeAxis = false,
}: Props) {

  const { delta: oiDelta } = useRealtimeOI(symbol)

  const whaleIntensity = useVIPMarketStore(s => s.whaleIntensity)
  const whaleNet = useVIPMarketStore(s => s.whaleNet)
  const fmai = useVIPMarketStore(s => s.fmai)

  const [history, setHistory] = useState<HistoryPoint[]>([])

  const visualValueRef = useRef(whaleIntensity)
  const targetValueRef = useRef(whaleIntensity)

  const chartId = 'whaleIntensity_desktop'

  /* store → target */
  useEffect(() => {
    targetValueRef.current = whaleIntensity
  }, [whaleIntensity])

  /* ==============================
     Chart Controller Register
     ============================== */

  useEffect(() => {

    chartController.registerChart<HistoryPoint>(
      chartId,
      BUFFER_SIZE,
      (data) => {
        setHistory(data)
      }
    )

    return () => {
      chartController.unregisterChart(chartId)
    }

  }, [])

  /* ==============================
     interpolation → chartBridge
     ============================== */

  useEffect(() => {

    let raf: number

    function loop() {

      const current = visualValueRef.current
      const target = targetValueRef.current

      const diff = target - current
      visualValueRef.current = current + diff * 0.15

      const point: HistoryPoint = {
        ts: Date.now(),
        value: visualValueRef.current,
        fmaiScore: fmai,
        whaleNetRatio: whaleNet,
        isSpike: Math.abs(fmai) > 0.8,
      }

      chartController
        .getBuffer<HistoryPoint>(chartId)
        ?.push(point)

      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)

    return () => cancelAnimationFrame(raf)

  }, [fmai, whaleNet])

  const latest = history.at(-1)

  const intensityValue = latest?.value ?? 0
  const whalePulse = latest?.isSpike ?? false
  const netValue = latest?.whaleNetRatio ?? 0

  const [shockwave, setShockwave] = useState(false)
  const [spikeGlow, setSpikeGlow] = useState(false)

  /* FX */

  useEffect(() => {
    if (whalePulse) {
      setSpikeGlow(true)
      const t = setTimeout(() => setSpikeGlow(false), 600)
      return () => clearTimeout(t)
    }
  }, [whalePulse])

  useEffect(() => {
    if (intensityValue > 80) {
      setShockwave(true)
      const t = setTimeout(() => setShockwave(false), 900)
      return () => clearTimeout(t)
    }
  }, [intensityValue])

  const yDomain = useMemo(() => {

    if (!history.length) return [0, 100]

    let min = Infinity
    let max = -Infinity

    for (const p of history) {
      if (p.value < min) min = p.value
      if (p.value > max) max = p.value
    }

    const padding = Math.max(2, (max - min) * 0.25)

    return [
      Math.max(0, min - padding),
      Math.min(100, max + padding),
    ]

  }, [history])

  const currentValue = intensityValue / 100

  const probability = calculateInstitutionalProbability({
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

    return history
      .filter(p => p?.isSpike)
      .slice(-5)
      .map(p => ({
        ts: p.ts,
        value: p.value,
      }))

  }, [history])

  return (
    <>
      <motion.div
        animate={strongSignal ? { scale: [1, 1.05, 1] } : { scale: 1 }}
        transition={{ duration: 0.8 }}
        className="rounded-xl border p-5 relative bg-vipCard overflow-hidden"
        style={{
          borderColor: confidenceColor,
          boxShadow: `0 0 40px ${confidenceColor}55`,
        }}
      >

        <AnimatePresence>
          {shockwave && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ opacity: 0.8, scale: 0.6 }}
              animate={{ opacity: 0, scale: 1.8 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              style={{
                background:
                  'radial-gradient(circle, rgba(255,0,0,0.6), transparent 65%)',
              }}
            />
          )}
        </AnimatePresence>

        <div className="mb-3">
          <div className="text-sm font-semibold text-white">
            Analysis of Institutional Fund Flows
          </div>

          <div className="text-xs text-neutral-400">
            Institutional whale transaction strength
          </div>
        </div>

        <div className="w-full h-[176px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history}>

              <XAxis dataKey="ts" hide={!showTimeAxis} />
              <YAxis domain={yDomain} hide />

              <Tooltip isAnimationActive={false} />

              <Line
                type="natural"
                dataKey="value"
                stroke="#ff4444"
                dot={false}
                strokeWidth={2.5}
                isAnimationActive={false}
              />

              <Area
                type="natural"
                dataKey="value"
                stroke="none"
                fill="rgba(255,0,0,0.3)"
                isAnimationActive={false}
              />

              <Scatter
                data={flags}
                dataKey="value"
                fill="#ff0000"
              />

              <ReferenceLine
                y={55}
                stroke="rgba(250,204,21,0.8)"
                strokeDasharray="4 4"
              />

            </AreaChart>
          </ResponsiveContainer>
        </div>

      </motion.div>

      <VIPInstitutionalGuideCard
        long={longProbability}
        short={shortProbability}
        confidence={displayConfidence}
        dominant={displayDominant}
        intensity={intensityValue}
      />
    </>
  )
}

export default React.memo(VIPWhaleIntensityChart)
