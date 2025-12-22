'use client';

export function VIP3LiveAdvantage({
  avgReliability,
}: {
  avgReliability: number;
}) {
  return (
    <div className="p-3 rounded bg-gradient-to-r from-yellow-100 to-yellow-50 text-sm">
      <strong>VIP3 Live Advantage</strong>
      <div className="mt-1">
        최근 Extreme 신뢰도 평균:{' '}
        {(avgReliability * 100).toFixed(1)}%
      </div>
      <div className="text-xs opacity-70 mt-1">
        VIP3는 안정 구간에서만 고급 알림을 제공합니다
      </div>
    </div>
  );
}
