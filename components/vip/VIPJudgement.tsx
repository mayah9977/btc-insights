import { judgeVipMarketState } from '@/lib/vip/vipJudgementEngine'
import { generateVipSentence } from '@/lib/vip/vipSentence'

type Props = {
  ai: number
  whale: number
  vol: number
}

export function VIPJudgement({ ai, whale, vol }: Props) {
  const state = judgeVipMarketState({
    aiScore: ai,
    whaleIntensity: whale,
    volatility: vol,
  })

  return (
    <div className="space-y-1">
      <div className="text-xs tracking-widest uppercase text-zinc-400">
        AI Market Judgement
      </div>

      <div className="text-xl font-semibold text-white leading-snug">
        {generateVipSentence(state)}
      </div>
    </div>
  )
}
