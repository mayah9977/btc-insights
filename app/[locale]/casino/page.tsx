// app/[locale]/casino/page.tsx

import { getSession } from '@/lib/auth/session'
import { VIP3GlowWrapper } from '@/components/realtime/VIP3GlowWrapper'

import LockedRiskInfo from '@/components/dashboard/casino/LockedRiskInfo'
import VIPEnterCTA from '@/components/dashboard/casino/VIPEnterCTA'

import HeroSection from './HeroSection'

import FortuneSection from '@/components/casino/FortuneSection'
import MarketSentimentSection from '@/components/casino/MarketSentimentSection'
import BtcChartSection from '@/components/casino/BtcChartSection'

export default async function CasinoPage() {

  const session = await getSession()

  const isLoggedIn = !!session
  const isVIP = session?.role === 'VIP'

  return (
    <div className="space-y-14">

      {/* 1️⃣ Hero */}
      <HeroSection
        isLoggedIn={isLoggedIn}
        isVIP={isVIP}
      />

      {/* 🔮 Fortune */}
      <FortuneSection />

      {/* 📊 Market Sentiment */}
      <MarketSentimentSection />

      {/* 📉 BTC Live Chart */}
      <BtcChartSection />

      {/* ⚠️ Risk Explanation */}
      <LockedRiskInfo />

      {/* 🚪 VIP Gate */}
      <VIP3GlowWrapper active={isVIP}>
        <VIPEnterCTA />
      </VIP3GlowWrapper>

      {/* Legal */}
      <footer className="text-xs text-zinc-600 pt-10 border-t border-zinc-800">
        본 화면은 투자·베팅을 권유하지 않으며,
        AI 기반 시장 구조 브리핑 접근 전 안내 페이지입니다.
      </footer>

    </div>
  )
}
