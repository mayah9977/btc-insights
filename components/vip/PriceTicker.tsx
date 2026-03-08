'use client'

import React from 'react'
import { useRealtimePrice } from '@/lib/realtime/useRealtimePrice'

function PriceTicker() {
  const { price } = useRealtimePrice('BTCUSDT')

  const btcPrice = price ?? 0

  return (
    <span className="text-2xl font-bold text-white">
      {btcPrice > 0 ? `$${btcPrice.toLocaleString()}` : '-'}
    </span>
  )
}

export default React.memo(PriceTicker)
