// app/[locale]/casino/page.tsx
// ✅ Server Component

import { getSession } from '@/lib/auth/session'
import { VIP3GlowWrapper } from '@/components/realtime/VIP3GlowWrapper'

import LockedRiskInfo from '@/components/dashboard/casino/LockedRiskInfo'
import VIPEnterCTA from '@/components/dashboard/casino/VIPEnterCTA'

import HeroSection from './HeroSection'

export default async function CasinoPage() {
  const session = await getSession()
  const isLoggedIn = !!session
  const isVIP = session?.role === 'VIP'

  return (
    <div className="space-y-24">

      {/* 1️⃣ 브리핑 헤더 */}
      <HeroSection
        isLoggedIn={isLoggedIn}
        isVIP={isVIP}
      />

      {/* 2️⃣ 고위험 분류 안내 */}
      <LockedRiskInfo />

      {/* 3️⃣ VIP 입장 게이트 */}
      <VIP3GlowWrapper active={isVIP}>
        <VIPEnterCTA />
      </VIP3GlowWrapper>

      {/* 4️⃣ 법적 고지 */}
      <footer className="text-xs text-zinc-600 pt-10 border-t border-zinc-800">
        본 화면은 투자·베팅을 권유하지 않으며,
        AI 기반 시장 구조 브리핑 접근 전 안내 페이지입니다.
      </footer>

    </div>
  )
}
