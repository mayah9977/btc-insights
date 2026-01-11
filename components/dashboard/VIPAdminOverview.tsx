'use client'

/**
 * ⚠️ VIPAdminOverview
 * --------------------------------------------------
 * 관리자 / 내부 운영용 대시보드 전용 컴포넌트
 *
 * - Casino 메인 ❌
 * - VIP 사용자 화면 ❌
 *
 * ⚠️ 주의:
 * 이 컴포넌트는 SSOT(store) 기반이 아님
 * 분석/통계/히스토리 함수를 직접 호출함
 *
 * → 운영 모니터링 / 관리자 판단용으로만 사용
 * → Casino / VIP 영역에서는 절대 import 금지
 * --------------------------------------------------
 */

import { useVIP } from '@/lib/vip/vipClient'
import { getAverageReliability } from '@/lib/extreme/extremeHistoryStore'
import { getNotificationStats } from '@/lib/notification/notificationHistoryStore'
import { VIP3StableZoneBadge } from '@/components/vip/VIP3StableZoneBadge'

export function VIPAdminOverview() {
  const { vipLevel } = useVIP()
  const avg = getAverageReliability()
  const stable = avg < 0.35
  const notif = getNotificationStats()

  return (
    <section className="p-4 space-y-4">
      <h2 className="text-lg font-bold">
        VIP Admin Overview
      </h2>

      {/* VIP 상태 */}
      <div className="border rounded p-3">
        <div className="text-sm">
          현재 VIP 등급:{' '}
          <strong>{vipLevel}</strong>
        </div>
      </div>

      {/* Extreme 상태 */}
      {vipLevel === 'VIP3' && (
        <div className="border rounded p-3 space-y-2">
          <div className="text-sm">
            Extreme 평균 신뢰도:{' '}
            <strong>
              {(avg * 100).toFixed(1)}%
            </strong>
          </div>

          <VIP3StableZoneBadge active={stable} />

          <div className="text-xs text-gray-500">
            Stable Zone에서는 알림이 최소화됩니다.
          </div>
        </div>
      )}

      {/* Notification 요약 */}
      <div className="border rounded p-3">
        <div className="text-sm font-semibold mb-1">
          Notification Summary
        </div>
        <div className="text-xs space-y-1">
          <div>전체: {notif.total}</div>
          <div>INFO: {notif.INFO}</div>
          <div>WARNING: {notif.WARNING}</div>
          <div>CRITICAL: {notif.CRITICAL}</div>
        </div>
      </div>
    </section>
  )
}
