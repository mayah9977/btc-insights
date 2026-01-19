'use client'

import { useEffect } from 'react'
import { useVIP } from '@/lib/vip/vipClient'

/* =========================
   KPI (TOP)
========================= */
import VIPTopKPIBar from '@/components/vip/VIPTopKPIBar'

/* =========================
   Value / Compare / Summary
========================= */
import VIPValueSummary from '@/components/vip/VIPValueSummary'
import VIPCompareTable from '@/components/vip/VIPCompareTable'
import VIP30DayEvasionBadge from '@/components/vip/VIP30DayEvasionBadge'
import VIPSummaryCards from '@/components/vip/VIPSummaryCards'
import VIP3AdvancedMetrics from '@/components/vip/VIP3AdvancedMetrics'

/* =========================
   Mobile Layout
========================= */
import VIPMobileLayout from '@/components/vip/VIPMobileLayout'

/* =========================
   Core Sections
========================= */
import { VIPOverviewDashboard } from '@/components/vip/VIPOverviewDashboard'
import { VIPJudgement } from '@/components/vip/VIPJudgement'
import VIPJudgementTimeline from '@/components/vip/VIPJudgementTimeline'
import VIPRiskPanel from '@/components/vip/VIPRiskPanel'
import VIPRiskHistoryTimeline from '@/components/vip/VIPRiskHistoryTimeline'
import VIPRiskScenarioHeatmap from '@/components/vip/VIPRiskScenarioHeatmap'
import VIPNoEntryReason from '@/components/vip/VIPNoEntryReason'
import VIPLossAvoidanceLog from '@/components/vip/VIPLossAvoidanceLog'
import { NotificationHistoryView } from '@/components/notifications/NotificationHistoryView'

/* =========================
   Phase 2 Cards
========================= */
import VIPTodayJudgementCard from '@/components/vip/VIPTodayJudgementCard'
import VIPRiskAvoidanceCard from '@/components/vip/VIPRiskAvoidanceCard'
import VIPDailySnapshot from '@/components/vip/VIPDailySnapshot'

/* =========================
   Types
========================= */
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'

type Summary = {
  period: '7d' | '30d'
  avoidedLossUSD: number
  avoidedExtremeCount: number
}

type VIP3Metrics = {
  extremeAccuracy: number
  avgAvoidedLoss30d: number
  stableZoneRatio: number
  confidenceScore: number
}

type VIPClientPageProps = {
  avoidedExtremeCount: number
  avoidedLossUSD: number
  weeklySummary: Summary
  monthlySummary: Summary

  /** ✅ 추가: VIP3 고급 지표 */
  vip3Metrics: VIP3Metrics
}

/* =========================
   Component (FINAL)
========================= */
export default function VIPClientPage({
  avoidedExtremeCount,
  avoidedLossUSD,
  weeklySummary,
  monthlySummary,
  vip3Metrics,
}: VIPClientPageProps) {
  const { vipLevel } = useVIP()

  const riskLevel: RiskLevel = 'HIGH'
  const btcPrice = 62338
  const avg30dAvoidedLossUSD = monthlySummary.avoidedLossUSD

  useEffect(() => {
    return () => {
      // realtime cleanup placeholder
    }
  }, [])

  return (
    <>
      {/* ========================= TOP KPI (ALL) ========================= */}
      <VIPTopKPIBar
        btcPrice={btcPrice}
        avoidedExtremeCount={avoidedExtremeCount}
        avoidedLossUSD={avoidedLossUSD}
      />

      {/* ========================= Mobile ========================= */}
      <VIPMobileLayout>
        <VIPValueSummary
          btcPrice={btcPrice}
          avoidedExtremeCount={avoidedExtremeCount}
          avoidedLossUSD={avoidedLossUSD}
        />

        <VIPSummaryCards weekly={weeklySummary} monthly={monthlySummary} />

        {/* ⭐ VIP3 고급 지표 (Mobile) */}
        <VIP3AdvancedMetrics
          extremeAccuracy={vip3Metrics.extremeAccuracy}
          avgAvoidedLoss30d={vip3Metrics.avgAvoidedLoss30d}
          stableZoneRatio={vip3Metrics.stableZoneRatio}
          confidenceScore={vip3Metrics.confidenceScore}
        />

        <VIP30DayEvasionBadge avgAvoidedLossUSD={avg30dAvoidedLossUSD} />

        <VIPCompareTable />

        <section className="space-y-2 mt-6">
          <h1 className="text-xl font-extrabold text-white">
            오늘 시장에서 피해야 했던 이유들
          </h1>
          <p className="text-sm text-zinc-400">
            이 리포트는 수익을 약속하지 않습니다.
            <br />
            위험 구조와 진입 제한 근거를 설명합니다.
          </p>
        </section>

        <VIPTodayJudgementCard />
        <VIPRiskAvoidanceCard />
        <VIPDailySnapshot />

        <VIPOverviewDashboard />
        <VIPJudgement />
        <VIPJudgementTimeline />

        <VIPRiskPanel riskLevel={riskLevel} />
        <VIPRiskHistoryTimeline />
        <VIPRiskScenarioHeatmap />
        <VIPNoEntryReason riskLevel={riskLevel} />

        <VIPLossAvoidanceLog />
      </VIPMobileLayout>

      {/* ========================= Desktop ========================= */}
      <main className="hidden md:block space-y-10">
        <VIPValueSummary
          btcPrice={btcPrice}
          avoidedExtremeCount={avoidedExtremeCount}
          avoidedLossUSD={avoidedLossUSD}
        />

        <VIPSummaryCards weekly={weeklySummary} monthly={monthlySummary} />

        {/* ⭐ VIP3 고급 지표 (Desktop) */}
        <VIP3AdvancedMetrics
          extremeAccuracy={vip3Metrics.extremeAccuracy}
          avgAvoidedLoss30d={vip3Metrics.avgAvoidedLoss30d}
          stableZoneRatio={vip3Metrics.stableZoneRatio}
          confidenceScore={vip3Metrics.confidenceScore}
        />

        <VIP30DayEvasionBadge avgAvoidedLossUSD={avg30dAvoidedLossUSD} />

        <VIPCompareTable />

        <header className="space-y-3">
          <h1 className="text-3xl font-extrabold text-white">
            오늘 시장에서 피해야 했던 이유들
          </h1>
          <p className="text-sm text-zinc-400">
            현재 등급: <b className="text-zinc-200">{vipLevel}</b>
          </p>
        </header>

        <VIPTodayJudgementCard />
        <VIPRiskAvoidanceCard />
        <VIPDailySnapshot />

        <VIPOverviewDashboard />
        <VIPJudgement />
        <VIPJudgementTimeline />

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
