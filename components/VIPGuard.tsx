'use client';

import { useVIP } from '@/lib/vip/vipClient';

export function VIPGuard({
  require,
  children,
}: {
  require: 'VIP1' | 'VIP2' | 'VIP3';
  children: React.ReactNode;
}) {
  const { vipLevel } = useVIP();

  const order = ['FREE', 'VIP1', 'VIP2', 'VIP3'];
  const allowed =
    order.indexOf(vipLevel) >= order.indexOf(require);

  if (allowed) return <>{children}</>;

  return (
    <main style={{ padding: 32 }}>
      <h2>🔒 VIP 전용 기능</h2>
      <p>
        이 기능은 <b>{require}</b> 이상 사용자에게
        제공되는 고급 분석 기능입니다.
      </p>
      <ul>
        <li>✔ 더 상세한 시장 데이터</li>
        <li>✔ 실시간 고급 알림</li>
        <li>✔ 분석 범위 확장</li>
      </ul>
      <button
        style={{ marginTop: 16 }}
        onClick={() => {
          window.location.href = '/account';
        }}
      >
        VIP 업그레이드 보기
      </button>
    </main>
  );
}
