'use client'

interface VIPValueSummaryProps {
  btcPrice: number
  avoidedExtremeCount: number
  avoidedLossUSD: number
}

export default function VIPValueSummary({
  btcPrice,
  avoidedExtremeCount,
  avoidedLossUSD,
}: VIPValueSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      {/* BTC PRICE */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <p className="text-sm text-neutral-400">현재 BTC 가격</p>
        <p className="text-2xl font-semibold text-white mt-1">
          ${btcPrice.toLocaleString()}
        </p>
        <p className="text-xs text-neutral-500 mt-2">
          실시간 시장 기준
        </p>
      </div>

      {/* EXTREME AVOIDED */}
      <div className="rounded-xl border border-green-800 bg-green-950/40 p-5">
        <p className="text-sm text-green-400">
          오늘 회피한 고위험 시나리오
        </p>
        <p className="text-2xl font-semibold text-green-300 mt-1">
          {avoidedExtremeCount}회
        </p>
        <p className="text-xs text-green-500 mt-2">
          EXTREME / HIGH 기준
        </p>
      </div>

      {/* AVOIDED LOSS */}
      <div className="rounded-xl border border-yellow-800 bg-yellow-950/40 p-5">
        <p className="text-sm text-yellow-400">
          VIP가 피한 추정 손실
        </p>
        <p className="text-2xl font-semibold text-yellow-300 mt-1">
          +${avoidedLossUSD.toLocaleString()}
        </p>
        <p className="text-xs text-yellow-500 mt-2">
          시나리오 기준 가상 손익
        </p>
      </div>
    </div>
  )
}
