'use client'

import React from 'react'
import { useRealtimeMarketComposite } from '@/lib/realtime/useRealtimeMarketComposite'

interface Props {
  symbol: string
}

export default function VIPLiveStatusStripMobile({
  symbol
}: Props) {

  const {
    oi,
    volume,
    whaleIntensity
  } = useRealtimeMarketComposite(symbol)

  return (
    <div
      className="
      px-4
      py-2
      text-xs
      flex
      justify-between
      items-center
      bg-zinc-900
      border-b
      border-zinc-800
    "
    >
      <div className="flex flex-col">
        <span className="text-gray-400">OI</span>
        <span className="text-green-400 font-semibold">
          {oi?.toLocaleString() ?? '--'}
        </span>
      </div>

      <div className="flex flex-col">
        <span className="text-gray-400">VOL</span>
        <span className="text-green-400 font-semibold">
          {volume?.toLocaleString() ?? '--'}
        </span>
      </div>

      <div className="flex flex-col">
        <span className="text-gray-400">WHALE</span>
        <span className="text-yellow-400 font-semibold">
          {(whaleIntensity ?? 0).toFixed(2)}
        </span>
      </div>
    </div>
  )
}
