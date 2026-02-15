'use client'

type Props = {
  avgAvoidedLossUSD: number
}

export default function VIP30DayEvasionBadge({
  avgAvoidedLossUSD,
}: Props) {
  // 🔒 관측된 회피 손실이 없으면 컴포넌트 자체 미생성
  if (
    typeof avgAvoidedLossUSD !== 'number' ||
    avgAvoidedLossUSD <= 0
  ) {
    return null
  }

  return (
    <div className="rounded-xl border border-amber-800 bg-amber-950/40 px-4 py-3">
      <p className="text-xs text-amber-400">
        최근 30일 VIP 회피 손실
      </p>

      <p className="text-lg font-semibold text-amber-300 mt-1">
        +${avgAvoidedLossUSD.toLocaleString()}
      </p>

      <p className="text-[11px] text-amber-500 mt-1">
        시나리오 기준 가상 손익 평균
      </p>
    </div>
  )
}
