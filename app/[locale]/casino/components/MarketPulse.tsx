import { judgeVipMarketState } from '@/lib/vip/vipJudgementEngine'

export default function MarketPulse({ aiScore, whale, vol }: any) {
  const state = judgeVipMarketState({
    aiScore,
    whaleIntensity: whale,
    volatility: vol,
  })

  return (
    <div className="rounded-xl bg-zinc-900 p-4 border border-zinc-800">
      <div className="text-sm text-zinc-400">Market Status</div>
      <div className="text-xl font-bold text-white mt-1">
        {state}
      </div>
    </div>
  )
}
