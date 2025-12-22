'use client'

import { motion } from 'framer-motion'
import {
  calcPressureIndex,
  pressureLabel,
} from '@/lib/notification/calcPressureIndex'

export function PressureGauge() {
  const pressure = calcPressureIndex()
  const label = pressureLabel(pressure)

  const color =
    pressure > 75
      ? 'bg-red-500'
      : pressure > 40
      ? 'bg-yellow-400'
      : 'bg-emerald-400'

  return (
    <div className="w-40">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-400">
          Pressure
        </span>
        <span className="font-semibold">
          {label}
        </span>
      </div>

      <div className="h-2 w-full rounded bg-white/10 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pressure}%` }}
          transition={{ duration: 0.4 }}
          className={`h-full ${color}`}
        />
      </div>

      <div className="mt-1 text-right text-xs text-gray-400">
        {pressure}%
      </div>
    </div>
  )
}
