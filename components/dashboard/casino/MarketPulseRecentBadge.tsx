'use client'

import { useVipOverviewStore } from '@/lib/vip/overviewStore'

/**
 * Market Pulse Recent Badge
 * - 계산 ❌
 * - 판단 ❌
 * - 최근 상태 변화에 대한 "사실 기반 신호"만 표시
 * - FOMO 유도용 연출 컴포넌트
 */
export default function MarketPulseRecentBadge() {
  const {
    lastRiskChangeMinutes,
    warningCountAfterExtreme,
    riskLevel,
  } = useVipOverviewStore()

  // 변화 이력이 없으면 표시하지 않음
  if (lastRiskChangeMinutes == null) return null

  return (
    <div className="flex flex-wrap gap-2">
      {/* 최근 리스크 변화 */}
      <span className="px-3 py-1 rounded-full text-xs
                       bg-yellow-500/20 text-yellow-300">
        ⚠️ Risk level 상승 {lastRiskChangeMinutes}분 전
      </span>

      {/* EXTREME 이후 경고 누적 */}
      {riskLevel === 'EXTREME' && (
        <span className="px-3 py-1 rounded-full text-xs
                         bg-red-600/20 text-red-300">
          🔥 EXTREME 이후 {warningCountAfterExtreme}회 경고
        </span>
      )}
    </div>
  )
}
