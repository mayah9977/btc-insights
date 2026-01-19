'use client'

type Summary = {
  period: '7d' | '30d'
  avoidedLossUSD: number
  avoidedExtremeCount: number
}

export default function VIPSummaryCards({
  weekly,
  monthly,
}: {
  weekly: Summary
  monthly: Summary
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[weekly, monthly].map((s) => (
        <div
          key={s.period}
          className="bg-vipCard border border-vipBorder rounded-2xl p-5"
        >
          <div className="text-sm text-zinc-400">
            최근 {s.period === '7d' ? '7일' : '30일'} 성과 요약
          </div>

          <div className="mt-2 text-xl font-semibold text-white">
            +${s.avoidedLossUSD.toLocaleString()}
          </div>

          <div className="mt-1 text-sm text-zinc-400">
            EXTREME 회피 {s.avoidedExtremeCount}회 · 시나리오 기준 가상 손익
          </div>
        </div>
      ))}
    </div>
  )
}
