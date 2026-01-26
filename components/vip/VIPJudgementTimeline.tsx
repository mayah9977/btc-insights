'use client'

import { useEffect, useRef } from 'react'

type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME'

type TimelineItem = {
  time: string
  state: string
  note: string
}

type Props = {
  /** 🔗 상위 SSOT에서 전달 */
  riskLevel: RiskLevel
  timeline: TimelineItem[]
}

export default function VIPJudgementTimeline({
  riskLevel,
  timeline,
}: Props) {
  // ✅ Hooks는 항상 최상단에서 호출
  const isExtreme = riskLevel === 'EXTREME'

  const containerRef = useRef<HTMLDivElement | null>(null)
  const lastItemRef = useRef<HTMLDivElement | null>(null)
  const hasAnimatedRef = useRef(false)

  const hasItems =
    Array.isArray(timeline) && timeline.length > 0

  /** 🔥 EXTREME 진입 시 자동 스크롤 + 1회 강조 */
  useEffect(() => {
    if (!hasItems) return

    if (!isExtreme) {
      hasAnimatedRef.current = false
      return
    }

    if (hasAnimatedRef.current) return

    if (lastItemRef.current) {
      lastItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
      hasAnimatedRef.current = true
    }
  }, [isExtreme, hasItems, timeline.length])

  // ✅ return null은 Hooks 이후에
  if (!hasItems) return null

  return (
    <div ref={containerRef} className="space-y-4">
      {timeline.map((t, i) => {
        const isLast = i === timeline.length - 1
        const highlight = isExtreme && isLast

        return (
          <div
            key={`${t.time}-${i}`}
            ref={isLast ? lastItemRef : null}
            className={`
              relative flex gap-4 rounded-xl p-4 border
              transition-all duration-500
              ${
                highlight
                  ? 'bg-red-950/60 border-red-600 shadow-[0_0_30px_rgba(239,68,68,0.35)] animate-pulse'
                  : isExtreme
                  ? 'bg-red-950/40 border-red-800'
                  : 'bg-vipCard border-vipBorder'
              }
            `}
          >
            {/* 시간 */}
            <div className="text-xs text-zinc-500 w-16 shrink-0">
              {t.time}
            </div>

            {/* 내용 */}
            <div className="flex-1">
              <div
                className={`font-medium ${
                  highlight
                    ? 'text-red-200'
                    : isExtreme
                    ? 'text-red-300'
                    : 'text-white'
                }`}
              >
                {t.state}
              </div>

              <div className="text-sm text-zinc-400 mt-1">
                {t.note}
              </div>
            </div>

            {/* 🔥 EXTREME 강조 바 */}
            {highlight && (
              <div className="absolute left-0 top-0 h-full w-1 bg-red-500 rounded-l-xl" />
            )}
          </div>
        )
      })}
    </div>
  )
}
