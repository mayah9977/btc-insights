'use client'

import type { VIPLevel } from '../lib/vipAccess'

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

type Props = {
  vipLevel: VIPLevel
}

/* =========================
   TEMP TYPES (빌드 안정화용)
========================= */
type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'

export default function VIPClientPage({ vipLevel }: Props) {
  /* =========================
     TEMP DATA (전환기용)
     ⚠️ container화 진행되며 제거
  ========================= */
  const riskLevel: RiskLevel = 'HIGH'

  // 아직 props 기반 컴포넌트들이므로 임시 any 허용
  const riskHistory = [] as any[]
  const scenarioData = [] as any[]
  const lossCases = [] as any[]

  return (
    <>
      {/* =========================
          Mobile
      ========================= */}
      <VIPMobileLayout>
        <VIPOverviewDashboard />

        <VIPJudgement />
        <VIPJudgementTimeline />

        <VIPRiskPanel riskLevel={riskLevel} />
        <VIPRiskHistoryTimeline />
        <VIPRiskScenarioHeatmap />
        <VIPNoEntryReason riskLevel={riskLevel} />
      </VIPMobileLayout>

      {/* =========================
          Desktop
      ========================= */}
      <main className="hidden md:block space-y-10">
        <header className="space-y-1">
          <h1 className="text-3xl font-extrabold text-white">
            👑 VIP 위험 판단 리포트
          </h1>
          <p className="text-sm text-zinc-400">
            현재 등급:{' '}
            <b className="text-zinc-200">{vipLevel}</b>
          </p>
        </header>

        <VIPOverviewDashboard />

        <VIPJudgement />
        <VIPJudgementTimeline />

        <VIPRiskPanel riskLevel={riskLevel} />
        <VIPRiskHistoryTimeline />
        <VIPRiskScenarioHeatmap />
        <VIPNoEntryReason riskLevel={riskLevel} />

        <VIPLossAvoidanceLog cases={lossCases} />
        <NotificationHistoryView />
      </main>
    </>
  )
}
