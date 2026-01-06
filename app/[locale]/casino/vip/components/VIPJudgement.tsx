import { generateVipSentence } from '@/lib/vip/vipSentence'
import { judgeVipMarketState } from '@/lib/vip/vipJudgementEngine'

export function VIPJudgement({ ai, whale, vol }: any) {
  const state = judgeVipMarketState({
    aiScore: ai,
    whaleIntensity: whale,
    volatility: vol,
  })

  return (
    <div className="text-lg font-medium text-white">
      {generateVipSentence(state)}
    </div>
  )
}
