'use client'

import { useState } from 'react'
import { useRealtimePrice } from '@/lib/realtime/useRealtimePrice'
import { useRealtimeOI } from '@/lib/realtime/useRealtimeOI'
import { useRealtimeVolume } from '@/lib/realtime/useRealtimeVolume'
import { useWhaleWarning } from '@/lib/realtime/useWhaleWarning'

import { useVipRealtime } from '@/lib/vip/useVipRealtime'
import { useStableRiskLevel } from '@/lib/vip/useStableRiskLevel'
import { useVipKpi } from '@/lib/vip/useVipKpi'
import { useLatestRiskEvent } from '@/lib/vip/useLatestRiskEvent'
import { useVipJudgementStore } from '@/lib/vip/judgementStore'
import { generateRiskSentence } from '@/lib/vip/riskSentence'

import { useInitialRiskHistory } from '@/lib/vip/useInitialRiskHistory'
import { useRiskHeatmapSync } from '@/lib/vip/useRiskHeatmapSync'

/* ================= KPI ================= */
import VIPTopKPIBar from '@/components/vip/VIPTopKPIBar'
import VIPLiveStatusStrip from '@/components/vip/VIPLiveStatusStrip'
import VIPNoEntryReasonBanner from '@/components/vip/VIPNoEntryReasonBanner'
import VIPWhaleWarningBanner from '@/components/vip/VIPWhaleWarningBanner'

/* ================= Summary ================= */
import VIPCompareTable from '@/components/vip/VIPCompareTable'
import VIP30DayEvasionBadge from '@/components/vip/VIP30DayEvasionBadge'
import VIPSummaryCards from '@/components/vip/VIPSummaryCards'
import VIP3AdvancedMetrics from '@/components/vip/VIP3AdvancedMetrics'

/* ================= Charts ================= */
import BtcLiveChart from '@/components/charts/BtcLiveChart'
import VIPWhaleIntensityChart from '@/components/vip/VIPWhaleIntensityChart'

/* ================= Sections ================= */
import VIPMobileLayout from '@/components/vip/VIPMobileLayout'
import { VIPOverviewDashboard } from '@/components/vip/VIPOverviewDashboard'
import { VIPJudgement } from '@/components/vip/VIPJudgement'
import VIPJudgementTimeline from '@/components/vip/VIPJudgementTimeline'
import VIPRiskPanel from '@/components/vip/VIPRiskPanel'
import VIPRiskHistoryTimeline from '@/components/vip/VIPRiskHistoryTimeline'
import VIPRiskScenarioHeatmap from '@/components/vip/VIPRiskScenarioHeatmap'
import VIPNoEntryReason from '@/components/vip/VIPNoEntryReason'
import VIPLossAvoidanceLog from '@/components/vip/VIPLossAvoidanceLog'
import { NotificationHistoryView } from '@/components/notifications/NotificationHistoryView'
import VIPTodayJudgementCard from '@/components/vip/VIPTodayJudgementCard'
import VIPRiskAvoidanceCard from '@/components/vip/VIPRiskAvoidanceCard'
import VIPDailySnapshot from '@/components/vip/VIPDailySnapshot'

type Props = {
  userId: string
  weeklySummary: any
  monthlySummary: any
  vip3Metrics: any
}

export default function VIPClientPage({
  userId,
  weeklySummary,
  monthlySummary,
  vip3Metrics,
}: Props) {
  useInitialRiskHistory()

  const realtime = useVipRealtime(userId)

  const riskLevel = useStableRiskLevel(realtime.riskLevel, {
    settleDelayMs: 3000,
    onStableChange: level => {
      useVipJudgementStore.getState().setJudgement({
        sentence: generateRiskSentence(level),
        confidence:
          level === 'LOW' ? 0.9 :
          level === 'MEDIUM' ? 0.8 :
          level === 'HIGH' ? 0.75 : 0.7,
      })
    },
  })

  useRiskHeatmapSync(riskLevel)

  const { timeline } = useVipJudgementStore()

  /* ===== Realtime Data ===== */
  const oiState = useRealtimeOI('BTCUSDT')
  const volumeState = useRealtimeVolume('BTCUSDT')
  const whaleWarning = useWhaleWarning('BTCUSDT')

  const priceState = useRealtimePrice('BTCUSDT')
  const [chartPrice, setChartPrice] = useState<number | null>(null)
  const btcPrice = chartPrice ?? priceState.price ?? 0

  const { avoidedExtremeCount = 0, avoidedLossUSD = 0 } = useVipKpi()
  const latestRiskEvent = useLatestRiskEvent()

  return (
    <>
      <VIPTopKPIBar
        btcPrice={btcPrice}
        avoidedExtremeCount={avoidedExtremeCount}
        avoidedLossUSD={avoidedLossUSD}
      />

      <VIPLiveStatusStrip
        riskLevel={riskLevel}
        lastTriggeredAt={realtime.lastTriggeredAt}
        whaleWarning={whaleWarning}
        volume={volumeState.volume}
      />

      {whaleWarning && riskLevel !== 'EXTREME' && (
        <VIPWhaleWarningBanner symbol="BTCUSDT" />
      )}

      <VIPNoEntryReasonBanner
        riskLevel={riskLevel}
        reason={latestRiskEvent?.reason}
      />

      {/* ================= Mobile ================= */}
      <VIPMobileLayout>
        <VIPSummaryCards weekly={weeklySummary} monthly={monthlySummary} />

        <div className="mt-3 space-y-1 text-xs text-zinc-400">
          <div>
            Open Interest:{' '}
            <span className="text-white font-medium">
              {oiState.openInterest?.toLocaleString() ?? '--'}
            </span>
          </div>
          <div>
            Volume:{' '}
            <span className="text-white font-medium">
              {volumeState.volume !== null
                ? volumeState.volume.toFixed(2)
                : '--'}
            </span>
          </div>
        </div>

        <VIPWhaleIntensityChart symbol="BTCUSDT" riskLevel={riskLevel} />
        <BtcLiveChart riskLevel={riskLevel} onPriceUpdate={setChartPrice} />

        <VIPTodayJudgementCard />
        <VIPJudgementTimeline riskLevel={riskLevel} timeline={timeline} />
        <VIP3AdvancedMetrics {...vip3Metrics} />
        <VIP30DayEvasionBadge avgAvoidedLossUSD={monthlySummary.avoidedLossUSD} />
        <VIPCompareTable />
        <VIPRiskAvoidanceCard />
        <VIPDailySnapshot />
        <VIPOverviewDashboard />
        <VIPJudgement />
        <VIPRiskPanel riskLevel={riskLevel} />
        <VIPRiskHistoryTimeline />
        <VIPRiskScenarioHeatmap />
        <VIPNoEntryReason riskLevel={riskLevel} />
        <VIPLossAvoidanceLog />
      </VIPMobileLayout>

      {/* ================= Desktop ================= */}
      <main className="hidden md:block space-y-10">
        <VIPSummaryCards weekly={weeklySummary} monthly={monthlySummary} />

        <div className="space-y-1 text-xs text-zinc-400">
          <div>
            Open Interest:{' '}
            <span className="text-white font-medium">
              {oiState.openInterest?.toLocaleString() ?? '--'}
            </span>
          </div>
          <div>
            Volume:{' '}
            <span className="text-white font-medium">
              {volumeState.volume !== null
                ? volumeState.volume.toFixed(2)
                : '--'}
            </span>
          </div>
        </div>

        <VIPWhaleIntensityChart symbol="BTCUSDT" riskLevel={riskLevel} />
        <BtcLiveChart riskLevel={riskLevel} onPriceUpdate={setChartPrice} />

        <VIPJudgementTimeline riskLevel={riskLevel} timeline={timeline} />
        <VIP3AdvancedMetrics {...vip3Metrics} />
        <VIP30DayEvasionBadge avgAvoidedLossUSD={monthlySummary.avoidedLossUSD} />
        <VIPCompareTable />
        <VIPRiskAvoidanceCard />
        <VIPDailySnapshot />
        <VIPOverviewDashboard />
        <VIPJudgement />
        <VIPRiskPanel riskLevel={riskLevel} />
        <VIPRiskHistoryTimeline />
        <VIPRiskScenarioHeatmap />
        <VIPNoEntryReason riskLevel={riskLevel} />
        <VIPLossAvoidanceLog />
        <NotificationHistoryView />
      </main>
    </>
  )
}
