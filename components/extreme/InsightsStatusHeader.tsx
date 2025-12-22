'use client'

import { motion, AnimatePresence } from 'framer-motion'

import { ExtremeReliabilityBadge } from '@/components/extreme/ExtremeReliabilityBadge'
import { VIP3GlowWrapper } from '@/components/realtime/VIP3GlowWrapper'
import { WSStatusBadge } from '@/components/realtime/WSStatusBadge'
import { PressureGauge } from '@/components/notifications/PressureGauge'

import {
  getAverageReliability,
  getExtremeHistory,
} from '@/lib/extreme/extremeHistoryStore'

export default function InsightsStatusHeader() {
  const avg = getAverageReliability()
  const history = getExtremeHistory()

  const isStableZone = avg < 0.35
  const lastExtremeAt =
    history.length > 0
      ? history[history.length - 1].at
      : null

  return (
    <motion.div
      layout
      className="
        sticky top-0 z-30
        rounded-xl border border-white/10
        bg-black/60 backdrop-blur
        px-4 py-3
      "
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* LEFT */}
        <div className="flex items-center gap-3">
          <ExtremeReliabilityBadge avg={avg} />

          <VIP3GlowWrapper active>
            <span className="text-xs font-semibold text-fuchsia-300">
              VIP3 VIEW
            </span>
          </VIP3GlowWrapper>

          <WSStatusBadge status="connected" />
        </div>

        {/* CENTER: PRESSURE */}
        <PressureGauge />

        {/* RIGHT */}
        <div className="flex items-center gap-4 text-xs text-white/50">
          <AnimatePresence mode="wait">
            <motion.span
              key={isStableZone ? 'stable' : 'volatile'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={
                isStableZone
                  ? 'text-emerald-400'
                  : 'text-orange-400'
              }
            >
              {isStableZone
                ? 'Stable Zone Active'
                : 'Volatile Zone'}
            </motion.span>
          </AnimatePresence>

          <span>
            Last Extreme:{' '}
            <strong className="text-white">
              {lastExtremeAt
                ? new Date(lastExtremeAt).toLocaleTimeString()
                : '--'}
            </strong>
          </span>
        </div>
      </div>
    </motion.div>
  )
}
