'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'

import { useVIPMarketStream } from '@/lib/realtime/useVIPMarketStream'

import { useVipKpi } from '@/lib/vip/useVipKpi'
import { useVipRiskHistoryStore } from '@/lib/vip/riskHistoryStore'
import { useVipHistoryStore } from '@/lib/vip/historyStore'

import VIPTopKPIBar from '@/components/vip/VIPTopKPIBar'
import VIPLiveStatusStrip from '@/components/vip/VIPLiveStatusStrip'
import VIPNoEntryReasonBanner from '@/components/vip/VIPNoEntryReasonBanner'
import VIPWhaleWarningBanner from '@/components/vip/VIPWhaleWarningBanner'

import VIPCompareTable from '@/components/vip/VIPCompareTable'
import VIP30DayEvasionBadge from '@/components/vip/VIP30DayEvasionBadge'
import VIPSummaryCards from '@/components/vip/VIPSummaryCards'
import VIP3AdvancedMetrics from '@/components/vip/VIP3AdvancedMetrics'

import VIPWhaleIntensityChart from '@/components/vip/VIPWhaleIntensityChart'
import VIPWhaleTradeFlowChart from '@/components/vip/VIPWhaleTradeFlowChart'

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

/* =========================
   Mobile Page (NEW)
========================= */

import VIPMobilePage from '@/components/vip/mobile/VIPMobilePage'

/* =========================
   Chart Dynamic Import
========================= */

const BtcLiveChart = dynamic(
  () => import('@/components/charts/BtcLiveChart'),
  { ssr: false }
)

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
     SSE
  ========================= */

  useVIPMarketStream('BTCUSDT')

  /* =========================
     Mobile Detect
  ========================= */

  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)

    check()

    window.addEventListener('resize', check)

    return () => window.removeEventListener('resize', check)
  }, [])

  /* =========================
     KPI
  ========================= */

  const { avoidedExtremeCount = 0, avoidedLossUSD = 0 } = useVipKpi()

  const { todayAvoidedLossPercent = 0 } = useVipHistoryStore()

  const { history } = useVipRiskHistoryStore()

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

  /* =========================
     MOBILE
  ========================= */

  if (isMobile) {
    return (
      <VIPMobilePage
        userId={userId}
        weeklySummary={weeklySummary}
        monthlySummary={monthlySummary}
        vip3Metrics={vip3Metrics}
      />
    )
  }

  /* =========================
     DESKTOP (기존 그대로)
  ========================= */

  return (
    <>
      <VIPTopKPIBar
        avoidedExtremeCount={avoidedExtremeCount}
        avoidedLossUSD={avoidedLossUSD}
      />

      <VIPActionGateContextBar symbol="BTCUSDT" />

      <RawObservationBar symbol="BTCUSDT" />

      <VIPLiveStatusStrip />

      <VIPWhaleWarningBanner symbol="BTCUSDT" />

      <VIPNoEntryReasonBanner />

      <main className="space-y-10">

        {shouldRenderAvoidanceSummary && (
          <VIPSummaryCards
            weekly={weeklySummary}
            monthly={monthlySummary}
          />
        )}

        <VIPWhaleIntensityChart symbol="BTCUSDT" />

        <VIPWhaleTradeFlowChart symbol="BTCUSDT" />

        <VIPSentimentPanel symbol="BTCUSDT" />

        <BtcLiveChart riskLevel="LOW" />

        <VIPFortunePanel />

        <VIPJudgementTimeline />

        <VIP3AdvancedMetrics {...vip3Metrics} />

        <VIP30DayEvasionBadge
          avgAvoidedLossUSD={monthlySummary.avoidedLossUSD}
        />

        <VIPCompareTable />

        <VIPRiskAvoidanceCard />

        <VIPDailySnapshot />

        <VIPOverviewDashboard />

        <VIPJudgement />

        <VIPRiskPanel />

        <VIPRiskScenarioHeatmap />

        <VIPNoEntryReason />

        <VIPLossAvoidanceLog />

        <NotificationHistoryView />

      </main>
    </>
  )
}
