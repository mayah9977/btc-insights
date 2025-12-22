'use client'

import {
  getExtremeHistory,
  getAverageReliability,
} from '@/lib/extreme/extremeHistoryStore'
import { getStableZoneLogs } from '@/lib/extreme/stableZoneLogStore'

import InsightsStatusHeader from '@/components/extreme/InsightsStatusHeader'
import { ExtremeHistoryGraph } from '@/components/extreme/ExtremeHistoryGraph'
import { ExtremeReliabilityBadge } from '@/components/extreme/ExtremeReliabilityBadge'
import { VIP3StableZoneBadge } from '@/components/vip/VIP3StableZoneBadge'
import { NotificationHeatmap } from '@/components/notifications/NotificationHeatmap'
import { VIP3PredictionCard } from '@/components/extreme/VIP3PredictionCard'
import { RealtimeErrorBoundary } from '@/components/system/RealtimeErrorBoundary'

/* 🔥 Action / Accuracy / Share */
import { PositionGuideCard } from '@/components/action/PositionGuideCard'
import { InsightsShareActions } from '@/components/insights/InsightsShareActions'

/* (선택) Feature Usage Tracking */
import { trackFeatureUsage } from '@/lib/analytics/featureUsageTracker'

export default function InsightsPage() {
  // ===== data =====
  const history = getExtremeHistory()
  const avg = getAverageReliability()
  const stable = avg < 0.35
  const stableLogs = getStableZoneLogs()

  // ===== usage tracking (페이지 진입) =====
  trackFeatureUsage('EXTREME_GRAPH')

  return (
    <main className="p-4 space-y-6">
      {/* ============================= */}
      {/* A. GLOBAL STATUS HEADER */}
      {/* ============================= */}
      <InsightsStatusHeader />

      {/* ============================= */}
      {/* PAGE TITLE + SHARE */}
      {/* ============================= */}
      <header className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold">
            Market Stability Insights
          </h1>
          <p className="text-sm text-gray-500">
            Extreme 신뢰도 흐름과 Stable Zone 상태 종합 분석
          </p>
        </div>

        {/* PDF / Share */}
        <InsightsShareActions />
      </header>

      {/* ============================= */}
      {/* B. CURRENT STATUS SUMMARY */}
      {/* ============================= */}
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

        <p className="text-xs text-gray-500 leading-relaxed">
          Stable Zone은 Extreme 신뢰도가 낮고,
          알림 밀도와 시장 변동성이 동시에 완화된
          상대적 안정 구간을 의미합니다.
        </p>
      </section>

      {/* ============================= */}
      {/* C. VIP3 PREDICTION + ACCURACY */}
      {/* ============================= */}
      <section className="border rounded-lg p-4">
        <VIP3PredictionCard />
      </section>

      {/* ============================= */}
      {/* D. ACTION GUIDE (DECISION) */}
      {/* ============================= */}
      <section className="border rounded-lg p-4">
        <PositionGuideCard />
      </section>

      {/* ============================= */}
      {/* E. EXTREME HISTORY GRAPH */}
      {/* ============================= */}
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

      {/* ============================= */}
      {/* F. NOTIFICATION HEATMAP */}
      {/* ============================= */}
      <section className="border rounded-lg p-4 space-y-2">
        <h2 className="text-sm font-semibold">
          Notification Heatmap
        </h2>

        <RealtimeErrorBoundary>
          <NotificationHeatmap />
        </RealtimeErrorBoundary>

        <p className="text-xs text-gray-500">
          색이 진할수록 해당 시간대 알림 빈도와
          시장 압력이 높았음을 의미합니다.
        </p>
      </section>

      {/* ============================= */}
      {/* G. STABLE ZONE TIMELINE */}
      {/* ============================= */}
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
                className="
                  flex justify-between items-center
                  px-3 py-2 rounded-md border
                  bg-emerald-50/80
                "
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
