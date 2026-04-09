//app/CasinoMobilePage.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'

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
<div className="px-4 pb-6">
<div className="max-w-[640px] mx-auto space-y-6">

    {/* =========================
      🐋 Whale Hero Visual
    ========================= */}
    <motion.div
      className="flex justify-center -mt-1"
      animate={{
        y: [-4, 4, -4],
        boxShadow: [
          '0 0 0px rgba(255,140,0,0)',
          '0 0 16px rgba(255,140,0,0.25)',
          '0 0 0px rgba(255,140,0,0)',
        ],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <img
        src="/images/whale-btc.png"
        alt="Whale BTC"
        className="w-full max-w-[300px] h-auto object-contain"
      />
    </motion.div>

    {/* =========================
      🔒 Locked Info
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
      <MarketSentimentSection />
    </section>

    {/* =========================
      📈 BTC Chart (Responsive Fix)
    ========================= */}
    <section className="rounded-2xl overflow-hidden">
      <div className="w-full min-h-[380px]">
        <BtcChartSection />
      </div>
    </section>

    {/* =========================
      🔮 Fortune (접기 구조)
    ========================= */}
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40">
      <motion.button
        onClick={() => setOpenFortune((prev) => !prev)}
        className="w-full px-4 py-3 text-left flex justify-between items-center bg-gradient-to-r from-yellow-600/20 to-yellow-400/10 border border-yellow-500/30 rounded-xl active:scale-95"
        animate={{
          boxShadow: [
            '0 0 0px rgba(255,215,0,0)',
            '0 0 16px rgba(255,215,0,0.35)',
            '0 0 0px rgba(255,215,0,0)',
          ],
          scale: [1, 1.02, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <span className="text-sm font-semibold text-yellow-300">
          오늘의 운세보기
        </span>
        <span className="text-xs text-yellow-400">
          {openFortune ? '닫기' : '열기'}
        </span>
      </motion.button>

      {openFortune && (
        <div className="px-4 pb-4 mt-4">
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
