import { useVipJudgementStore } from '@/lib/vip/judgementStore'

/**
 * Presenter-only component
 * - props ❌
 * - 계산 / 엔진 호출 ❌
 * - store에 저장된 판단 결과만 표시
 */
export function VIPJudgement() {
  const { judgementSentence, confidence } = useVipJudgementStore()

  return (
    <div className="space-y-1">
      <div className="text-xs tracking-widest uppercase text-zinc-400">
        AI Market Judgement
      </div>

      <div className="text-xl font-semibold text-white leading-snug">
        {judgementSentence}
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
