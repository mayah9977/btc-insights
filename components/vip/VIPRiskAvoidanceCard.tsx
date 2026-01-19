'use client'

import { useVipHistoryStore } from '@/lib/vip/historyStore'

/**
 * VIP Risk Avoidance Card
 * - 계산 ❌
 * - SSOT(historyStore) 값만 사용
 * - store 스키마가 달라도 터지지 않게 안전 가드
 */
export default function VIPRiskAvoidanceCard() {
  const state = useVipHistoryStore()

  // ✅ store에 "있을 수도 있는" 후보 키들에서 값 찾기 (스키마 차이 흡수)
  const avoided =
    (state as any).todayAvoidedLossRate ??
    (state as any).todayAvoidedLossPercent ??
    (state as any).avoidanceRateToday ??
    (state as any).avoidedLossRate

  const sample =
    (state as any).referenceSampleCount ??
    (state as any).sampleCount ??
    (state as any).refCount ??
    0

  const hasToday =
    (state as any).hasTodayData ??
    (state as any).hasToday ??
    (state as any).todayAvailable ??
    typeof avoided === 'number'

  if (!hasToday || typeof avoided !== 'number') return null

  const avoidedPercent = Math.abs(avoided).toFixed(1)

  return (
    <section className="rounded-2xl border border-vipBorder bg-vipCard p-6 space-y-4">
      <div className="text-xs tracking-widest uppercase text-zinc-400">
        Today’s Risk Avoidance
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-emerald-400">
          {avoidedPercent}%
        </span>
        <span className="text-sm text-zinc-400">위험 회피</span>
      </div>

      <div className="text-sm text-zinc-400 leading-relaxed">
        오늘과 유사한 과거{' '}
        <b className="text-zinc-200">{sample}</b>
        건의 고위험 구간에서 평균적으로 발생했던 손실을 피한 것으로 분석됩니다.
      </div>

      <div className="text-xs text-zinc-500">
        * 실제 수익이 아닌, 과거 통계 기반 추정치입니다.
      </div>
    </section>
  )
}
