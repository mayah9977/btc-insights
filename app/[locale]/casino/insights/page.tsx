'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

import InsightsStatusHeader from '@/components/extreme/InsightsStatusHeader'
import { ExtremeHistoryGraph } from '@/components/extreme/ExtremeHistoryGraph'
import { ExtremeReliabilityBadge } from '@/components/extreme/ExtremeReliabilityBadge'
import { VIP3StableZoneBadge } from '@/components/vip/VIP3StableZoneBadge'
import { NotificationHeatmap } from '@/components/notifications/NotificationHeatmap'
import { VIP3PredictionCard } from '@/components/extreme/VIP3PredictionCard'
import { RealtimeErrorBoundary } from '@/components/system/RealtimeErrorBoundary'
import { PositionGuideCard } from '@/components/action/PositionGuideCard'
import { InsightsShareActions } from '@/components/insights/InsightsShareActions'

import { trackFeatureUsage } from '@/lib/analytics/featureUsageTracker'

type ExtremeHistoryItem = {
  at: number
  reliability: number
}

type StableLog = {
  at: number
  avgReliability: number
}

export default function InsightsPage() {
  const [history, setHistory] = useState<ExtremeHistoryItem[]>([])
  const [avg, setAvg] = useState(0)
  const [stableLogs, setStableLogs] = useState<StableLog[]>([])

  const stable = avg < 0.35

  // ✅ 데이터는 반드시 API로
  useEffect(() => {
    trackFeatureUsage('EXTREME_GRAPH')

    ;(async () => {
      const res = await fetch('/api/extreme/summary')
      if (!res.ok) return

      const data = await res.json()
      setHistory(data.history ?? [])
      setAvg(data.avgReliability ?? 0)
      setStableLogs(data.stableLogs ?? [])
    })()
  }, [])

  return (
    <main className="p-4 space-y-6">
      <InsightsStatusHeader />

      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold">
            Market Stability Insights
          </h1>
          <p className="text-sm text-gray-500">
            Extreme 신뢰도 흐름과 Stable Zone 상태 종합 분석
          </p>
        </div>
        <InsightsShareActions />
      </header>

      <section className="border rounded-lg p-4 space-y-3 bg-black/30">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span>
            현재 Extreme 평균 신뢰도:{' '}
            <strong className="text-white">
              {(avg * 100).toFixed(1)}%
            </strong>
          </span>
          <ExtremeReliabilityBadge avg={avg} />
        </div>

        <VIP3StableZoneBadge active={stable} />
      </section>

      <section className="border rounded-lg p-4">
        <VIP3PredictionCard />
      </section>

      <section className="border rounded-lg p-4">
        <PositionGuideCard />
      </section>

      <section className="border rounded-lg p-4 space-y-2">
        <h2 className="text-sm font-semibold">
          Extreme Reliability History
        </h2>

        {history.length === 0 ? (
          <div className="text-sm text-gray-400">
            아직 Extreme 데이터가 없습니다.
          </div>
        ) : (
          <RealtimeErrorBoundary>
            <ExtremeHistoryGraph data={history} />
          </RealtimeErrorBoundary>
        )}
      </section>

      <section className="border rounded-lg p-4 space-y-2">
        <h2 className="text-sm font-semibold">
          Notification Heatmap
        </h2>
        <RealtimeErrorBoundary>
          <NotificationHeatmap />
        </RealtimeErrorBoundary>
      </section>

      <section className="border rounded-lg p-4 space-y-2">
        <h2 className="text-sm font-semibold">
          Stable Zone Entry History
        </h2>

        {stableLogs.length === 0 ? (
          <div className="text-sm text-gray-400">
            아직 Stable Zone 진입 기록이 없습니다.
          </div>
        ) : (
          <ul className="space-y-2 text-sm">
            {stableLogs.map((log, i) => (
              <li
                key={i}
                className="flex justify-between items-center px-3 py-2 rounded-md border bg-emerald-50/80"
              >
                <span className="text-gray-700">
                  {new Date(log.at).toLocaleString()}
                </span>
                <span className="font-semibold text-emerald-700">
                  {(log.avgReliability * 100).toFixed(1)}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  )
}
