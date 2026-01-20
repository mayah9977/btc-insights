'use client'

import { useVipJudgementStore } from '@/lib/vip/judgementStore'

export function VIPJudgement() {
  const { judgmentSentence, confidence } = useVipJudgementStore()

  return (
    <div className="space-y-1">
      <div className="text-xs tracking-widest uppercase text-zinc-400">
        AI Market Judgement
      </div>

      <div className="text-xl font-semibold text-white leading-snug">
        {judgmentSentence}
      </div>

      <div className="text-xs text-zinc-400">
        신뢰도{' '}
        <b className="text-zinc-200">
          {Math.round(confidence * 100)}%
        </b>
      </div>
    </div>
  )
}
