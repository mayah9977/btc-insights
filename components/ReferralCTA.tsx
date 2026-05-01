// components/ReferralCTA.tsx
'use client'

import { useVIP } from '@/hooks/useVIP'

export default function ReferralCTA() {
  const { data, loading } = useVIP()

  if (loading) {
    return (
      <div className="px-6 py-3 rounded-xl bg-slate-700 text-center text-sm">
        로딩 중...
      </div>
    )
  }

  const isVip = data?.isVip ?? false

  const href = isVip
    ? 'https://vip-exchange-link.com'
    : '/ko/vip/upgrade'

  return (
    <a
      href={href}
      className="px-6 py-3 rounded-xl bg-emerald-500 text-black font-semibold inline-block text-center transition hover:scale-105"
    >
      {isVip ? 'VIP 거래소 이동' : 'VIP 업그레이드'}
    </a>
  )
}
