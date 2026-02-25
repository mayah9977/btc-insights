'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRealtimePrice } from '@/lib/realtime/useRealtimePrice'
import { useWhaleWarning } from '@/lib/realtime/useWhaleWarning'
import { useVipExtremeNotifier } from '@/lib/vip/useVipExtremeNotifier'
import { useStableRiskLevel } from '@/lib/vip/useStableRiskLevel'
import { useVipKpi } from '@/lib/vip/useVipKpi'
import { useLatestRiskEvent } from '@/lib/vip/useLatestRiskEvent'
import { useVipJudgementStore } from '@/lib/vip/judgementStore'
import { useLiveRiskState } from '@/lib/realtime/liveRiskState'
import { useVipRiskHistoryStore } from '@/lib/vip/riskHistoryStore'
import { useVipHistoryStore } from '@/lib/vip/historyStore'
import { startLiveRiskTicker } from '@/lib/realtime/liveRiskTicker'

import VIPTopKPIBar from '@/components/vip/VIPTopKPIBar'
import VIPLiveStatusStrip from '@/components/vip/VIPLiveStatusStrip'
import VIPNoEntryReasonBanner from '@/components/vip/VIPNoEntryReasonBanner'
import VIPWhaleWarningBanner from '@/components/vip/VIPWhaleWarningBanner'
import VIPCompareTable from '@/components/vip/VIPCompareTable'
import VIP30DayEvasionBadge from '@/components/vip/VIP30DayEvasionBadge'
import VIPSummaryCards from '@/components/vip/VIPSummaryCards'
import VIP3AdvancedMetrics from '@/components/vip/VIP3AdvancedMetrics'
import BtcLiveChart from '@/components/charts/BtcLiveChart'
import VIPWhaleIntensityChart from '@/components/vip/VIPWhaleIntensityChart'
import VIPWhaleTradeFlowChart from '@/components/vip/VIPWhaleTradeFlowChart'
import VIPMobileLayout from '@/components/vip/VIPMobileLayout'
import { VIPOverviewDashboard } from '@/components/vip/VIPOverviewDashboard'
import { VIPJudgement } from '@/components/vip/VIPJudgement'
import VIPJudgementTimeline from '@/components/vip/VIPJudgementTimeline'
import VIPRiskPanel from '@/components/vip/VIPRiskPanel'
import VIPRiskScenarioHeatmap from '@/components/vip/VIPRiskScenarioHeatmap'
import VIPNoEntryReason from '@/components/vip/VIPNoEntryReason'
import VIPLossAvoidanceLog from '@/components/vip/VIPLossAvoidanceLog'
import { NotificationHistoryView } from '@/components/notifications/NotificationHistoryView'
import VIPTodayJudgementCard from '@/components/vip/VIPTodayJudgementCard'
import VIPRiskAvoidanceCard from '@/components/vip/VIPRiskAvoidanceCard'
import VIPDailySnapshot from '@/components/vip/VIPDailySnapshot'
import { VIPActionGateContextBar } from '@/components/vip/VIPActionGateContextBar'
import { RawObservationBar } from '@/components/market/observation/RawObservationBar'
import VIPSentimentPanel from '@/components/vip/VIPSentimentPanel'
import VIPFortunePanel from '@/components/vip/VIPFortunePanel'

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

  /* =========================
   * 🔥 모바일 판별 (hidden 제거)
   * ========================= */
  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    startLiveRiskTicker()
  }, [])

  const liveRisk = useLiveRiskState(s => s.state)
  const rawRiskLevel = liveRisk?.level ?? 'LOW'

  const riskLevel = useStableRiskLevel(rawRiskLevel, {
    settleDelayMs: 3000,
  })

  useVipExtremeNotifier(userId, rawRiskLevel)

  const whaleWarning = useWhaleWarning('BTCUSDT')
  const { price } = useRealtimePrice('BTCUSDT')
  const btcPrice = price ?? 0

  const { avoidedExtremeCount = 0, avoidedLossUSD = 0 } = useVipKpi()
  const { todayAvoidedLossPercent = 0 } = useVipHistoryStore()
  const { history } = useVipRiskHistoryStore()
  const latestRiskEvent = useLatestRiskEvent()

  const hasExtremeInRiskHistory = useMemo(
    () => history.some(h => h.level === 'EXTREME'),
    [history],
  )

  const shouldRenderAvoidanceSummary =
    weeklySummary.avoidedExtremeCount > 0 ||
    monthlySummary.avoidedExtremeCount > 0 ||
    todayAvoidedLossPercent > 0 ||
    hasExtremeInRiskHistory

  if (isMobile === null) return null

  return (
    <>
      <VIPTopKPIBar
        btcPrice={btcPrice}
        avoidedExtremeCount={avoidedExtremeCount}
        avoidedLossUSD={avoidedLossUSD}
      />

      <VIPActionGateContextBar symbol="BTCUSDT" />
      <RawObservationBar symbol="BTCUSDT" />
      <VIPLiveStatusStrip />

      {whaleWarning && riskLevel !== 'EXTREME' && (
        <VIPWhaleWarningBanner symbol="BTCUSDT" />
      )}

      <VIPNoEntryReasonBanner
        riskLevel={riskLevel as any}
        reason={latestRiskEvent?.reason}
      />

      {/* ================= MOBILE ================= */}
      {isMobile && (
        <VIPMobileLayout>
          {shouldRenderAvoidanceSummary && (
            <VIPSummaryCards
              weekly={weeklySummary}
              monthly={monthlySummary}
            />
          )}

          <VIPWhaleIntensityChart symbol="BTCUSDT" riskLevel={riskLevel as any} />
          <VIPWhaleTradeFlowChart symbol="BTCUSDT" />
          <VIPSentimentPanel symbol="BTCUSDT" />
          <BtcLiveChart riskLevel={riskLevel as any} />
          <VIPFortunePanel />
          <VIPTodayJudgementCard />
          <VIPJudgementTimeline />
          <VIP3AdvancedMetrics {...vip3Metrics} />
          <VIP30DayEvasionBadge avgAvoidedLossUSD={monthlySummary.avoidedLossUSD} />
          <VIPCompareTable />
          <VIPRiskAvoidanceCard />
          <VIPDailySnapshot />
          <VIPOverviewDashboard />
          <VIPJudgement />
          <VIPRiskPanel />
          <VIPRiskScenarioHeatmap />
          <VIPNoEntryReason riskLevel={riskLevel as any} />
          <VIPLossAvoidanceLog />
        </VIPMobileLayout>
      )}

      {/* ================= DESKTOP ================= */}
      {!isMobile && (
        <main className="space-y-10">
          {shouldRenderAvoidanceSummary && (
            <VIPSummaryCards
              weekly={weeklySummary}
              monthly={monthlySummary}
            />
          )}

          <VIPWhaleIntensityChart symbol="BTCUSDT" riskLevel={riskLevel as any} />
          <VIPWhaleTradeFlowChart symbol="BTCUSDT" />
          <VIPSentimentPanel symbol="BTCUSDT" />
          <BtcLiveChart riskLevel={riskLevel as any} />
          <VIPFortunePanel />
          <VIPJudgementTimeline />
          <VIP3AdvancedMetrics {...vip3Metrics} />
          <VIP30DayEvasionBadge avgAvoidedLossUSD={monthlySummary.avoidedLossUSD} />
          <VIPCompareTable />
          <VIPRiskAvoidanceCard />
          <VIPDailySnapshot />
          <VIPOverviewDashboard />
          <VIPJudgement />
          <VIPRiskPanel />
          <VIPRiskScenarioHeatmap />
          <VIPNoEntryReason riskLevel={riskLevel as any} />
          <VIPLossAvoidanceLog />
          <NotificationHistoryView />
        </main>
      )}
    </>
  )
}
