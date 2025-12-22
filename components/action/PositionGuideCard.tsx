'use client'

import { motion } from 'framer-motion'
import { calcPressureIndex } from '@/lib/notification/calcPressureIndex'
import { getAverageReliability } from '@/lib/extreme/extremeHistoryStore'
import { calcPositionGuide } from '@/lib/risk/calcPositionGuide'

export function PositionGuideCard() {
  const pressure = calcPressureIndex()
  const reliability = getAverageReliability()
  const risk =
    pressure > 75 || reliability < 0.25
      ? 'HIGH'
      : pressure > 40
      ? 'MEDIUM'
      : 'LOW'

  const guide = calcPositionGuide(risk, pressure)

  const color =
    guide.action === 'LONG'
      ? 'text-emerald-400'
      : guide.action === 'SHORT'
      ? 'text-red-400'
      : 'text-yellow-300'

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="border rounded-lg p-4 bg-black/40"
    >
      <div className="text-xs text-gray-400 mb-1">
        ACTION GUIDE
      </div>

      <div className="flex items-center justify-between">
        <div>
          <div className={`text-2xl font-bold ${color}`}>
            {guide.action}
          </div>
          <div className="text-xs text-gray-400">
            {guide.reason}
          </div>
        </div>

        <button
          className="
            px-3 py-1 rounded-md text-sm
            bg-white/10 hover:bg-white/20
          "
        >
          View Details
        </button>
      </div>
    </motion.div>
  )
}
