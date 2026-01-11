'use client'

import { useVipOverviewStore } from '@/lib/vip/overviewStore'
import { VIP3StableZoneBadge } from './VIP3StableZoneBadge'

/**
 * VIP Overview Dashboard
 * - props ❌
 * - 계산 ❌
 * - VIP 상태 요약은 SSOT(store)에서만 읽기
 */
export function VIPOverviewDashboard() {
  const {
    vipLevel,
    averageReliability,
    stableZoneActive,
  } = useVipOverviewStore()

  return (
    <section className="p-4 space-y-3">
      <h2 className="text-lg font-bold">
        VIP Dashboard
      </h2>

      <div className="text-sm">
        현재 등급: <strong>{vipLevel}</strong>
      </div>

      {vipLevel === 'VIP3' && (
        <>
          <div className="text-sm">
            Extreme 평균 신뢰도:{' '}
            <strong>
              {(averageReliability * 100).toFixed(1)}%
            </strong>
          </div>

          <VIP3StableZoneBadge active={stableZoneActive} />

          <ul className="text-xs text-gray-600 mt-2 space-y-1">
            <li>• 안정 구간에서는 알림이 최소화됩니다</li>
            <li>• 신뢰도 상승 시 자동으로 고급 알림 활성화</li>
          </ul>
        </>
      )}
    </section>
  )
}
