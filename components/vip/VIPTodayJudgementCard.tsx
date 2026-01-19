'use client'

import { useVipJudgementStore } from '@/lib/vip/judgementStore'

/**
 * VIP Today Judgement Card
 * - VIP 전용 "오늘의 판단 요약"
 * - 계산 ❌
 * - 해석 ❌
 * - SSOT(judgementStore)에서 확정된 결과만 표시
 */
export default function VIPTodayJudgementCard() {
  const { judgmentSentence, confidence, timeline } =
    useVipJudgementStore()

  if (!judgmentSentence) return null

  const safeConfidence =
    typeof confidence === 'number'
      ? `${(confidence * 100).toFixed(1)}%`
      : '—'

  const recentReasons = Array.isArray(timeline)
    ? timeline.slice(-3)
    : []

  return (
    <section className="rounded-2xl border border-vipBorder bg-vipCard p-6 space-y-4">
      <div className="text-xs tracking-widest uppercase text-zinc-400">
        Today’s VIP Judgement
      </div>

      <div className="text-xl font-bold text-white leading-snug">
        {judgmentSentence}
      </div>

      <div className="text-sm text-zinc-400">
        판단 신뢰도:{' '}
        <b className="text-zinc-200">
          {safeConfidence}
        </b>
      </div>

      {recentReasons.length > 0 && (
        <ul className="text-sm text-zinc-400 list-disc list-inside space-y-1">
          {recentReasons.map((item, i) => (
            <li key={`${item.time ?? 't'}-${i}`}>
              {item.state}
            </li>
          ))}
        </ul>
      )}

      <div className="text-xs text-zinc-500">
        기준 시각: 오늘
      </div>
    </section>
  )
}
