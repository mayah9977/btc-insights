// app/[locale]/casino/vip/vipClientPage.tsx

'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

import VIPMobilePage from '@/components/vip/mobile/VIPMobilePage'
import { useVIPMarketStream } from '@/lib/realtime/useVIPMarketStream'

type Props = {
  userId: string
  isVIP: boolean
  weeklySummary: any
  monthlySummary: any
  vip3Metrics: any
}

/* Desktop page dynamic import */
const VIPDesktopPage = dynamic<Omit<Props, 'isVIP'>>(
  () =>
    import('./desktop/VIPDesktopPage').then(
      (mod) => mod.default
    ),
  { ssr: false }
)

export default function VIPClientPage({
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

  // ================= FREE USER UI =================
  if (!isVIP) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 text-white text-center">
        <div className="max-w-sm w-full">
          {/* 핵심 메시지 */}
          <h1 className="text-2xl font-bold leading-snug">
            VIP 전용 기능입니다
          </h1>

          <p className="mt-3 text-sm text-slate-400">
            실시간 데이터, 고급 분석, 전략 기능은
            VIP 사용자에게만 제공됩니다.
          </p>

          {/* 강조 카드 */}
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-sm text-slate-300 space-y-2">
            <div>✔ 실시간 시장 데이터 (지연 없음)</div>
            <div>✔ VIP 전용 전략 시그널</div>
            <div>✔ 고급 온체인 분석</div>
            <div>✔ 리스크 알림 시스템</div>
          </div>

          {/* CTA */}
          <a
            href="/ko/vip/upgrade"
            className="mt-8 block w-full rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-600 py-4 text-lg font-bold text-black active:scale-[0.98] transition"
          >
            VIP 업그레이드
          </a>

          {/* 모바일 보조 텍스트 */}
          <p className="mt-3 text-xs text-slate-500">
            결제 후 즉시 VIP 활성화
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

  // ================= VIP USER =================
  if (isMobile) {
    return <VIPMobilePage {...sharedProps} />
  }

  return <VIPDesktopPage {...sharedProps} />
}
