'use client'

import { useVipOverviewStore } from '@/lib/vip/overviewStore'

/**
 * Casino Addictive Indicator
 * - 계산 ❌
 * - overviewStore에 이미 존재하는 값만 사용
 */
export default function CasinoAddictiveIndicator() {
  const {
    warningCount30m,
    riskLevel,
  } = useVipOverviewStore()

  // “변화 빈도”를 경고 발생 수로 번역
  const pace = warningCount30m

  return (
    <section className="rounded-xl border border-zinc-700 bg-zinc-900 p-4 space-y-1">
      <div className="text-xs tracking-widest uppercase text-zinc-400">
        Market Volatility Pace
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-orange-400">
          {pace}
        </span>
        <span className="text-sm text-zinc-400">
          신호 / 30분
        </span>
      </div>

      <div className="text-xs text-zinc-500">
        현재 위험 단계: <b>{riskLevel}</b>
      </div>
    </section>
  )
}
