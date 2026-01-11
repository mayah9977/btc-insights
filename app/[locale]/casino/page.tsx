// app/[locale]/casino/page.tsx
// ✅ Server Component

import Link from 'next/link'

import PageHeader from '@/components/ui/PageHeader'
import { CasinoRealtimeUI } from './CasinoRealtimeUI'
import { NotificationCenter } from '@/components/notifications/NotificationCenter'
import { VIP3GlowWrapper } from '@/components/realtime/VIP3GlowWrapper'

// 🎰 Casino Production Layer
import MarketPulse from '@/components/dashboard/casino/MarketPulse'
import LockedRiskInfo from '@/components/dashboard/casino/LockedRiskInfo'
import VIPEnterCTA from '@/components/dashboard/casino/VIPEnterCTA'

export default function CasinoPage() {
  return (
    <div className="space-y-12">
      {/* Stage 0: Header */}
      <PageHeader
        title="카지노 실시간 관제"
        description="실시간 가격 압력 · 위험 신호 · 알림 상태 요약"
      />

      {/* 🎰 Stage 1: Market Mood (Casino Essence) */}
      <MarketPulse />

      {/* 🎛️ Stage 2: Control Room */}
      <CasinoRealtimeUI vipLevel="FREE" />

      {/* 📡 Stage 2.5: Notification Snapshot */}
      <section>
        <h2 className="text-sm font-semibold text-neutral-400 mb-3">
          최근 알림
        </h2>
        <NotificationCenter />
      </section>

      {/* 🔒 Stage 3: Forbidden Information */}
      <LockedRiskInfo />

      {/* 👑 Stage 4: Decision Moment (VIP CTA) */}
      <VIP3GlowWrapper active={true}>
        <VIPEnterCTA />
      </VIP3GlowWrapper>

      {/* ⚠️ Disclaimer */}
      <footer className="text-xs text-neutral-500 pt-6">
        본 화면은 투자·베팅을 권유하지 않으며,
        실시간 데이터 기반 참고용 정보입니다.
      </footer>
    </div>
  )
}
