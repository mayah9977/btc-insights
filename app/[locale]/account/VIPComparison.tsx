'use client'

export default function VIPComparison({
  myPNL,
  vipAvgPNL,
}: {
  myPNL: number
  vipAvgPNL: number
}) {
  const diff = myPNL - vipAvgPNL
  const positive = diff >= 0

  return (
    <div className="rounded-2xl bg-vipCard border border-vipBorder p-5 text-zinc-200">
      <h3 className="font-semibold mb-3 text-white">
        👑 VIP Performance Benchmark
      </h3>

      <div className="text-sm text-zinc-400">
        VIP 평균 수익
      </div>
      <div className="text-lg font-semibold">
        {vipAvgPNL.toFixed(2)} USDT
      </div>

      <div
        className={`mt-4 text-2xl font-bold ${
          positive ? 'text-emerald-400' : 'text-red-400'
        }`}
      >
        {positive ? '+' : ''}
        {diff.toFixed(2)} USDT
      </div>

      <div className="mt-1 text-xs text-zinc-400">
        {positive
          ? 'VIP 평균 대비 우수한 성과입니다'
          : 'VIP 평균 대비 성과 개선 여지가 있습니다'}
      </div>
    </div>
  )
}
