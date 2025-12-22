'use client'

import { getRiskDurationStats } from '@/lib/risk/riskDurationStore'

function format(ms: number) {
  const s = Math.floor(ms / 1000)
  const m = Math.floor(s / 60)
  return `${m}m ${s % 60}s`
}

export function VIP3RiskHistoryReport() {
  const stats = getRiskDurationStats()

  return (
    <div className="border rounded-xl p-4 bg-black/40">
      <div className="text-xs text-fuchsia-300 font-semibold mb-1">
        VIP3 RISK REPORT
      </div>

      <div className="text-sm">
        <div>
          High Risk Occurrences:{' '}
          <strong>{stats.count}</strong>
        </div>

        <div>
          Avg Duration:{' '}
          <strong>{format(stats.averageMs)}</strong>
        </div>

        <div>
          Total Exposure:{' '}
          <strong>{format(stats.totalMs)}</strong>
        </div>
      </div>

      <p className="mt-2 text-xs text-gray-400">
        Based on detected HIGH risk intervals.
        Use this report to validate system timing.
      </p>
    </div>
  )
}
