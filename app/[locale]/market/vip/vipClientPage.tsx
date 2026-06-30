//app/[locale]/casino/vip/vipClientPage.tsx

'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

import VIPMobilePage from '@/components/vip/mobile/VIPMobilePage'
import { useVIPMarketStream } from '@/lib/realtime/useVIPMarketStream'
import VIPSignupCTA from './VIPSignupCTA'

type Props = {
  locale: string
  userId: string | null
  isVIP: boolean
  weeklySummary: any
  monthlySummary: any
  vip3Metrics: any
}

const VIPDesktopPage = dynamic<{
  userId: string
  weeklySummary: any
  monthlySummary: any
  vip3Metrics: any
}>(
  () =>
    import('./desktop/VIPDesktopPage').then(
      (mod) => mod.default
    ),
  { ssr: false }
)

export default function VIPClientPage({
  locale,
  isVIP,
  userId,
  weeklySummary,
  monthlySummary,
  vip3Metrics,
}: Props) {
  useVIPMarketStream('BTCUSDT')

  const [isMobile, setIsMobile] = useState<boolean | null>(null)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)

    check()
    window.addEventListener('resize', check)

    return () => window.removeEventListener('resize', check)
  }, [])

  if (isMobile === null) return null

  if (!isVIP || !userId) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 py-16 text-white text-center bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.18),transparent_35%),linear-gradient(135deg,#020617,#020617_55%,#052e2b)]">
        <div className="max-w-sm w-full">
          <h1 className="text-2xl font-bold leading-snug">
            VIP 전용 기능입니다
          </h1>

          <p className="mt-3 text-sm text-slate-400">
            실시간 데이터, 고급 분석, 전략 기능은
            VIP 사용자에게만 제공됩니다.
          </p>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-sm text-slate-300 space-y-2 backdrop-blur-xl">
            <div>✔ 실시간 시장 데이터 (지연 없음)</div>
            <div>✔ VIP 전용 전략 시그널</div>
            <div>✔ 고급 온체인 분석</div>
            <div>✔ 리스크 알림 시스템</div>
          </div>

          <VIPSignupCTA locale={locale} />

          <p className="mt-3 text-xs text-slate-500">
            결제 페이지에서 계정 정보를 입력한 뒤 결제가 진행됩니다.
          </p>
        </div>
      </main>
    )
  }

  const sharedProps = {
    userId,
    weeklySummary,
    monthlySummary,
    vip3Metrics,
  }

  if (isMobile) {
    return <VIPMobilePage {...sharedProps} />
  }

  return <VIPDesktopPage {...sharedProps} />
}
