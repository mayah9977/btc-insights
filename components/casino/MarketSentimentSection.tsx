'use client'

import MarketSentimentPanel from '@/components/market/sentiment/MarketSentimentPanel'

export default function MarketSentimentSection() {
  return (
    <section
      className="
        relative
        rounded-2xl
        border border-vipBorder
        bg-vipCard
        p-6 md:p-8
        shadow-[0_20px_60px_rgba(0,0,0,0.7)]
      "
    >
      <MarketSentimentPanel symbol="BTCUSDT" />
    </section>
  )
}
