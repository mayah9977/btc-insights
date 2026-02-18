'use client'

import { useLiveBollingerCommentary } from '@/lib/realtime/useLiveBollingerCommentary'

/**
 * 🔥 Live 상태 표시 전용
 * - 문장 렌더 ❌
 * - SSOT 문장과 완전 분리
 * - "실시간 형성 중" UI 레이어만 담당
 */

export function LiveBollingerCommentaryBanner() {
  const live = useLiveBollingerCommentary()

  if (!live) return null

  return (
    <div
      className="
        mt-3
        rounded-xl
        px-4
        py-2
        text-xs
        tracking-wide
        text-amber-300
        bg-amber-500/10
        border border-amber-400/20
        backdrop-blur-sm
        animate-pulse
      "
    >
      🔄 Reflecting real-time structural analysis (실시간 구조 분석 반영중)
    </div>
  )
}
