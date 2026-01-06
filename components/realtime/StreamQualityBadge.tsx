'use client'

import { getStreamQuality } from '@/lib/realtime/streamQualityMonitor'

export function StreamQualityBadge() {
  const { dropRate } = getStreamQuality()

  const colorClass =
    dropRate < 0.01
      ? 'text-emerald-400'
      : dropRate < 0.05
      ? 'text-yellow-400'
      : 'text-red-400'

  return (
    <span className={`text-xs font-medium ${colorClass}`}>
      Drop {(dropRate * 100).toFixed(1)}%
    </span>
  )
}
