'use client'

import { useState } from 'react'

import LockedRiskInfo from '@/components/dashboard/casino/LockedRiskInfo'

import HeroSection from '@/components/casino/hero/HeroSection'
import FortuneSection from '@/components/casino/FortuneSection'
import MarketSentimentSection from '@/components/casino/MarketSentimentSection'
import BtcChartSection from '@/components/casino/BtcChartSection'

export default function CasinoMobilePage({
  isLoggedIn,
  isVIP,
}: {
  isLoggedIn: boolean
  isVIP: boolean
}) {
  const [openFortune, setOpenFortune] = useState(false)

  return (
    <div className="px-4 py-6">
      <div className="max-w-[640px] mx-auto space-y-6">

        {/* =========================
            🔒 Locked Info (최상단)
        ========================= */}
        <LockedRiskInfo />

        {/* =========================
            🧠 Hero
        ========================= */}
        <HeroSection isLoggedIn={isLoggedIn} isVIP={isVIP} />

        {/* =========================
            📊 Market Sentiment
        ========================= */}
        <section className="rounded-2xl overflow-hidden">
          <div className="scale-[0.92] origin-top">
            <MarketSentimentSection />
          </div>
        </section>

        {/* =========================
            📈 BTC Chart (높이 제한)
        ========================= */}
        <section className="rounded-2xl overflow-hidden">
          <div className="h-[280px] overflow-hidden">
            <BtcChartSection />
          </div>
        </section>

        {/* =========================
            🔮 Fortune (접기 구조)
        ========================= */}
        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40">
          <button
            onClick={() => setOpenFortune((prev) => !prev)}
            className="w-full px-4 py-3 text-left flex justify-between items-center"
          >
            <span className="text-sm font-semibold text-white">
              오늘의 운세보기
            </span>
            <span className="text-xs text-zinc-400">
              {openFortune ? '닫기' : '열기'}
            </span>
          </button>

          {openFortune && (
            <div className="px-4 pb-4">
              <FortuneSection />
            </div>
          )}
        </section>

        {/* =========================
            ⚠️ Footer
        ========================= */}
        <footer className="text-[10px] text-zinc-600 pt-6 border-t border-zinc-800 leading-relaxed">
          본 화면은 투자·베팅을 권유하지 않으며,
          <br />
          AI 기반 시장 구조 브리핑 접근 전 안내 페이지입니다.
        </footer>

      </div>
    </div>
  )
}
