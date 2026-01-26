'use client'

import { useVipJudgementStore } from '@/lib/vip/judgementStore'

/**
 * VIP Today Judgement Card
 *
 * 📌 시각화 위치 (중요)
 * - 실시간 Risk 경고 ❌
 * - 진입/차단 판단 ❌
 * - 배너 하단, 차트 이후
 * - Risk Panel / History 이전
 *
 * 역할:
 * - 오늘 시장 상태에 대한 "해석 코멘트"
 * - 이미 발생한 Risk 흐름을 사람 언어로 요약
 *
 * SSOT:
 * - judgementStore (실시간 + 누적)
 */
export default function VIPTodayJudgementCard() {
  const {
    judgmentSentence,
    confidence,
    timeline,
  } = useVipJudgementStore()

  // ✅ 해석 문장이 없으면 노출하지 않음
  if (!judgmentSentence) return null

  const safeConfidence =
    typeof confidence === 'number'
      ? `${(confidence * 100).toFixed(1)}%`
      : null

  // 최근 판단 근거 최대 2개만 표시
  const recentReasons = Array.isArray(timeline)
    ? timeline.slice(-2)
    : []

  return (
    <section
      className="
        rounded-2xl
        border border-zinc-800
        bg-zinc-900/40
        p-5
        space-y-3
      "
    >
      {/* 라벨 */}
      <div className="text-xs uppercase tracking-wider text-zinc-500">
        오늘 시장 해석
      </div>

      {/* 해석 코멘트 */}
      <div className="text-base font-semibold text-zinc-100 leading-relaxed">
        {judgmentSentence}
      </div>

      {/* 판단 신뢰도 (보조 정보) */}
      {safeConfidence && (
        <div className="text-xs text-zinc-400">
          판단 신뢰도{' '}
          <span className="text-zinc-300 font-medium">
            {safeConfidence}
          </span>
        </div>
      )}

      {/* 최근 판단 근거 */}
      {recentReasons.length > 0 && (
        <ul className="text-xs text-zinc-400 list-disc list-inside space-y-1">
          {recentReasons.map((item, i) => (
            <li key={`${item.time ?? 't'}-${i}`}>
              {item.state}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
