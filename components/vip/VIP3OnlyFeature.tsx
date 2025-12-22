'use client';

import { useVIP } from '@/lib/vip/vipClient';

export default function VIP3OnlyFeature() {
  const { vipLevel } = useVIP();

  if (vipLevel !== 'VIP3') return null;

  return (
    <div className="p-4 border rounded bg-purple-50">
      <h3 className="font-bold text-purple-700">VIP3 전용 고급 분석</h3>
      <p className="text-sm mt-2">
        이 섹션은 VIP3 사용자에게만 제공되는 프리미엄 인사이트입니다.
      </p>
    </div>
  );
}
