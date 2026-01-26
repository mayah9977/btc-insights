'use client'

import { useDailyAvoidedLossSummary } from '@/lib/vip/useDailyAvoidedLossSummary'
import VIPDeltaIndicator from '@/components/vip/VIPDeltaIndicator'

/**
 * VIP Risk Avoidance Card
 *
 * 역할:
 * - Today’s Risk Avoidance 시각화
 * - ❌ 계산 없음
 * - ✅ DailyAvoidedLossSummary SSOT만 사용
 */
export default function VIPRiskAvoidanceCard() {
  const summary = useDailyAvoidedLossSummary()

  if (
    !summary ||
    typeof summary.extremeAvoidanceRate !== 'number'
  ) {
    return null
  }

  const avoidedPercent =
    summary.extremeAvoidanceRate.toFixed(1)

  return (
    <section className="rounded-2xl border border-vipBorder bg-vipCard p-6 space-y-4">
      {/* 타이틀 */}
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-widest uppercase text-zinc-400">
          Today’s Risk Avoidance
        </span>

        {/* 어제 대비 변화율 */}
        <VIPDeltaIndicator
          deltaPercent={summary.yesterdayDeltaPercent}
        />
      </div>

      {/* 핵심 수치 */}
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-emerald-400">
          {avoidedPercent}%
        </span>
        <span className="text-sm text-zinc-400">
          위험 회피
        </span>
      </div>

      {/* 설명 */}
      <div className="text-sm text-zinc-400 leading-relaxed">
        오늘과 유사한 과거 고위험 구간의 통계를 기준으로,
        평균적으로 발생했던 손실을 회피한 비율입니다.
      </div>

      {/* 주의 문구 */}
      <div className="text-xs text-zinc-500">
        * 실제 수익이 아닌, 과거 데이터 기반 추정치입니다.
      </div>
    </section>
  )
}
