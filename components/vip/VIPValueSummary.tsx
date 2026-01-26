'use client'

/**
 * ⚠️ DEPRECATED (보관용)
 *
 * 이 컴포넌트는 기존 VIP KPI 요약 UI이며,
 * 현재는 `VIPTopKPIBar`로 대체되어 사용되지 않습니다.
 *
 * 목적:
 * - 과거 UI 레퍼런스 보관
 * - 향후 리포트 / PDF / 이메일 요약용 재활용 가능
 *
 * ❌ 현재 페이지에서는 import / render 하지 않음
 */

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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* BTC PRICE */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-5">
        <p className="text-sm text-neutral-400">
          현재 BTC 가격
        </p>

        <p className="mt-1 text-2xl font-semibold text-white">
          {btcPrice > 0
            ? `$${btcPrice.toLocaleString()}`
            : '—'}
        </p>

        <p className="mt-2 text-xs text-neutral-500">
          실시간 시장 기준
        </p>
      </div>

      {/* EXTREME AVOIDED */}
      <div className="rounded-xl border border-green-800 bg-green-950/40 p-5">
        <p className="text-sm text-green-400">
          오늘 회피한 고위험 시나리오
        </p>

        <p className="mt-1 text-2xl font-semibold text-green-300">
          {Number.isFinite(avoidedExtremeCount)
            ? `${avoidedExtremeCount}회`
            : '—'}
        </p>

        <p className="mt-2 text-xs text-green-500">
          EXTREME / HIGH 기준
        </p>
      </div>

      {/* AVOIDED LOSS */}
      <div className="rounded-xl border border-yellow-800 bg-yellow-950/40 p-5">
        <p className="text-sm text-yellow-400">
          VIP가 피한 추정 손실
        </p>

        <p className="mt-1 text-2xl font-semibold text-yellow-300">
          +${(avoidedLossUSD ?? 0).toLocaleString()}
        </p>

        <p className="mt-2 text-xs text-yellow-500">
          시나리오 기준 가상 손익
        </p>
      </div>
    </div>
  )
}
