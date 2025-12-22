'use client';

import { useState } from 'react';

type Props = {
  vipLevel: 'VIP1' | 'VIP2' | 'VIP3';
  userId: string;
  locale: string;
};

export default function UpgradeButton({ vipLevel, userId, locale }: Props) {
  const [loading, setLoading] = useState(false);

  const onClick = async () => {
    try {
      setLoading(true);

      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vipLevel,
          userId,
          locale,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url; // 👉 Stripe Checkout 이동
      } else {
        alert('결제 페이지 생성 실패');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="rounded bg-black px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-50"
    >
      {loading ? '결제 페이지 생성 중...' : `${vipLevel} 업그레이드`}
    </button>
  );
}
