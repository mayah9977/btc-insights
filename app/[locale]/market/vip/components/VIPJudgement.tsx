import { judgeVipMarketState } from '@/lib/vip/vipJudgementEngine'

export default function VIPJudgement({ aiScore, whale, vol }: any) {
  const result = judgeVipMarketState({
    aiScore,
    whaleIntensity: whale,
    volatility: vol,
  })

  return (
    <div className="text-lg font-medium text-white">
      {result.state}
    </div>
  )
}
