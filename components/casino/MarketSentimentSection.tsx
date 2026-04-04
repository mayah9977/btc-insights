'use client'

import MarketSentimentPanel from '@/components/market/sentiment/MarketSentimentPanel'

export default function MarketSentimentSection() {
  return (
    <section>
      <MarketSentimentPanel symbol="BTCUSDT" />
    </section>
  )
}
