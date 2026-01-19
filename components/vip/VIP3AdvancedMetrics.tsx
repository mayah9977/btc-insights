'use client'

import { VIP3Only } from './VIP3Only'

type Props = {
  extremeAccuracy: number          // %
  avgAvoidedLoss30d: number        // USD
  stableZoneRatio: number          // %
  confidenceScore: number          // 0~100
}

export default function VIP3AdvancedMetrics({
  extremeAccuracy,
  avgAvoidedLoss30d,
  stableZoneRatio,
  confidenceScore,
}: Props) {
  const metrics = [
    {
      label: 'EXTREME 회피 정확도',
      value: `${extremeAccuracy}%`,
      desc: '실제 EXTREME 발생 대비 사전 차단 비율',
    },
    {
      label: '30일 평균 회피 손실',
      value: `$${avgAvoidedLoss30d.toLocaleString()}`,
      desc: '고변동 구간 기준 가상 손실 회피 평균',
    },
    {
      label: 'Stable Zone 유지율',
      value: `${stableZoneRatio}%`,
      desc: '안정 구간 유지 성공 비율',
    },
    {
      label: 'AI 신뢰 점수',
      value: `${confidenceScore} / 100`,
      desc: '신호 일관성 + 사후 검증 기반',
    },
  ]

  return (
    <VIP3Only>
      <section className="rounded-2xl border border-purple-700 bg-purple-950/40 p-6 space-y-4">
        <header>
          <h3 className="text-lg font-bold text-purple-300">
            VIP3 Advanced Risk Metrics
          </h3>
          <p className="text-xs text-purple-400">
            누적 데이터 기반 고급 판단 지표 (VIP3 전용)
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {metrics.map((m) => (
            <div
              key={m.label}
              className="rounded-xl bg-black/40 border border-purple-800 p-4"
            >
              <p className="text-xs text-purple-400">{m.label}</p>
              <p className="mt-1 text-xl font-bold text-white">
                {m.value}
              </p>
              {m.desc && (
                <p className="mt-1 text-[11px] text-zinc-500 leading-snug">
                  {m.desc}
                </p>
              )}
            </div>
          ))}
        </div>

        <p className="text-[11px] text-zinc-500">
          * 실제 수익이 아닌, 시나리오 기준 판단 성과 지표입니다.
        </p>
      </section>
    </VIP3Only>
  )
}
