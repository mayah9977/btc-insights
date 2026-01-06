'use client'

import { useMemo, useEffect, useState } from 'react'

import { useWhaleHistory } from '../lib/whaleHistoryStore'
import { useExtremeTheme } from '../lib/extremeThemeStore'
import type { VIPLevel } from '../lib/vipAccess'

import VIPCard from '@/components/vip/VIPCard'
import VIPRiskPulse from '@/components/vip/VIPRiskPulse'
import VIPRiskPanel from '@/components/vip/VIPRiskPanel'
import VIPScenarioTimeline from '@/components/vip/VIPScenarioTimeline'
import VIPJudgementTimeline from '@/components/vip/VIPJudgementTimeline'
import VIPLossAvoidanceLog from '@/components/vip/VIPLossAvoidanceLog'
import VIPMobileLayout from '@/components/vip/VIPMobileLayout'
import { VIPJudgement } from '@/components/vip/VIPJudgement'

import VIPSessionReportCard from '../components/VIPSessionReportCard'
import VIPWhaleHeatmap from '../components/VIPWhaleHeatmap'

import { calculateRiskLevel } from '@/lib/vip/riskEngine'
import { generateVipScenarios } from '@/lib/vip/generateVipScenarios'
import { applyRiskWeight } from '@/lib/vip/applyRiskWeight'

type Props = {
  vipLevel: VIPLevel
}

export default function VIPClientPage({ vipLevel }: Props) {
  /* =========================
     External Stores
  ========================= */
  const { logs } = useWhaleHistory()
  const { extreme } = useExtremeTheme()

  /* =========================
     Hydration-safe timestamp
  ========================= */
  const [mountedAt, setMountedAt] = useState('')
  useEffect(() => {
    setMountedAt(new Date().toISOString())
  }, [])

  /* =========================
     Mocked realtime metrics
  ========================= */
  const aiScore = 42
  const whaleIntensity = 0.61
  const volatility = extreme ? 0.82 : 0.64
  const trendScore = -0.3

  /* =========================
     Risk Calculation
  ========================= */
  const riskLevel = calculateRiskLevel({
    volatility,
    aiScore,
    whaleIntensity,
    extremeSignal: extreme,
  })

  /* =========================
     Scenario Generation
  ========================= */
  const baseScenarios = generateVipScenarios({
    riskLevel,
    trendScore,
    volatility,
  })

  const scenarios = applyRiskWeight(
    baseScenarios.map((s) => ({
      ...s,
      baseProbability: s.probability,
    })),
    riskLevel,
  ).map((s) => ({
    ...s,
    probability: s.baseProbability,
  }))

  /* =========================
     Session Report
  ========================= */
  const report = useMemo(() => {
    const breakdown = { high: 0, medium: 0, low: 0 }

    logs.forEach((l) => {
      if (l.intensity === 'HIGH') breakdown.high++
      else if (l.intensity === 'MEDIUM') breakdown.medium++
      else breakdown.low++
    })

    return {
      summary: `총 ${logs.length}건 고래 이벤트`,
      totalEvents: logs.length,
      breakdown,
      extremeMode: extreme,
      generatedAt: mountedAt,
    }
  }, [logs, extreme, mountedAt])

  return (
    <>
      {/* =========================
          Mobile
      ========================= */}
      <VIPMobileLayout>
        <VIPRiskPulse riskLevel={riskLevel} />

        <VIPCard title="Market Judgement" accent="danger">
          <VIPJudgement ai={aiScore} whale={whaleIntensity} vol={volatility} />
        </VIPCard>

        <VIPRiskPanel riskLevel={riskLevel} />

        <VIPCard title="Next Scenarios">
          <VIPScenarioTimeline scenarios={scenarios} />
        </VIPCard>

        <VIPWhaleHeatmap vipLevel={vipLevel} />

        <VIPSessionReportCard report={report} />
      </VIPMobileLayout>

      {/* =========================
          Desktop (content only)
      ========================= */}
      <main className="hidden md:block space-y-10">
        {/* Header */}
        <header className="space-y-1">
          <h1 className="text-3xl font-extrabold text-white">
            👑 VIP 대시보드
          </h1>
          <p className="text-sm text-zinc-400">
            현재 등급: <b className="text-zinc-200">{vipLevel}</b>
          </p>
          {extreme && (
            <p className="text-red-400 font-semibold mt-1">
              🔥 EXTREME MODE (자동 진입 제한)
            </p>
          )}
        </header>

        <VIPRiskPulse riskLevel={riskLevel} />

        <VIPCard title="Market Judgement" accent="danger">
          <VIPJudgement ai={aiScore} whale={whaleIntensity} vol={volatility} />
        </VIPCard>

        <div className="grid grid-cols-2 gap-6">
          <VIPRiskPanel riskLevel={riskLevel} cooldownMinutes={15} />
          <VIPCard title="Next Scenarios">
            <VIPScenarioTimeline scenarios={scenarios} />
          </VIPCard>
        </div>

        <VIPCard title="Whale Activity">
          <VIPWhaleHeatmap vipLevel={vipLevel} />
        </VIPCard>

        <VIPCard title="Judgement Timeline">
          <VIPJudgementTimeline
            timeline={[
              {
                time: '12:10',
                state: '변동성 확대',
                note: 'Whale 체결 증가 감지',
              },
              {
                time: '12:25',
                state: `Risk ${riskLevel}`,
                note: '진입 제한 판단',
              },
            ]}
          />
        </VIPCard>

        <VIPCard title="Session Report">
          <VIPSessionReportCard report={report} />
        </VIPCard>

        <VIPCard title="Loss Avoidance Proof">
          <VIPLossAvoidanceLog
            cases={[
              {
                date: '2025-01-02',
                market: 'BTCUSDT',
                avoidedLossPercent: 6.4,
                reason: 'Extreme 변동성 + Whale 불균형',
              },
            ]}
          />
        </VIPCard>
      </main>
    </>
  )
}
