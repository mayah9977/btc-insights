'use client';

import { useVIP } from '@/lib/vip/vipClient';
import { getAverageReliability } from '@/lib/extreme/extremeHistoryStore';
import { VIP3StableZoneBadge } from './VIP3StableZoneBadge';

export function VIPDashboard() {
  const { vipLevel } = useVIP();
  const avg = getAverageReliability();
  const stable = avg < 0.35;

  return (
    <section className="p-4 space-y-3">
      <h2 className="text-lg font-bold">VIP Dashboard</h2>

      <div className="text-sm">
        현재 등급: <strong>{vipLevel}</strong>
      </div>

      {vipLevel === 'VIP3' && (
        <>
          <div className="text-sm">
            Extreme 평균 신뢰도:{' '}
            <strong>
              {(avg * 100).toFixed(1)}%
            </strong>
          </div>

          <VIP3StableZoneBadge active={stable} />

          <ul className="text-xs text-gray-600 mt-2 space-y-1">
            <li>• 안정 구간에서는 알림이 최소화됩니다</li>
            <li>• 신뢰도 상승 시 자동으로 고급 알림 활성화</li>
          </ul>
        </>
      )}
    </section>
  );
}
