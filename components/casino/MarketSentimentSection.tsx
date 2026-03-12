'use client'

import MarketSentimentPanel from '@/components/market/sentiment/MarketSentimentPanel'

export default function MarketSentimentSection() {
  return (
    <section className="max-w-6xl mx-auto px-4">
      <MarketSentimentPanel symbol="BTCUSDT" />
    </section>
  )
}
