'use client'

import { calcPressureIndex } from '@/lib/notification/calcPressureIndex'
import { getAverageReliability } from '@/lib/extreme/extremeHistoryStore'

export function VIP3MobileUltraCard() {
  const pressure = calcPressureIndex()
  const reliability = getAverageReliability()

  const risk =
    pressure > 75 || reliability < 0.25
      ? '↑'
      : pressure > 40
      ? '→'
      : '↓'

  const color =
    risk === '↑'
      ? 'text-red-400'
      : risk === '→'
      ? 'text-yellow-300'
      : 'text-emerald-400'

  return (
    <div className="md:hidden flex items-center justify-between rounded-lg border p-3 bg-black/60">
      <span className="text-sm">
        Risk
      </span>
      <span
        className={`text-xl font-bold ${color}`}
      >
        {risk}
      </span>
      <span className="text-xs text-gray-400">
        P {pressure}%
      </span>
    </div>
  )
}
