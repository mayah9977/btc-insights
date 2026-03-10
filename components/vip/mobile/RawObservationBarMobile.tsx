'use client'

import React from 'react'

import { useRealtimeOI } from '@/lib/realtime/useRealtimeOI'
import { useRealtimeVolume } from '@/lib/realtime/useRealtimeVolume'
import { useRealtimeFundingRate } from '@/lib/realtime/useRealtimeFundingRate'

interface Props {
  symbol: string
}

export default function RawObservationBarMobile({
  symbol
}: Props) {

  const oi = useRealtimeOI(symbol)
  const vol = useRealtimeVolume(symbol)
  const fund = useRealtimeFundingRate(symbol)

  return (
    <div
      className="
      grid
      grid-cols-3
      gap-3
      px-4
      py-3
      text-xs
      bg-black
      border-b
      border-zinc-800
    "
    >
      <div>
        <div className="text-gray-400">OI</div>

        <div className="text-green-400 font-semibold">
          {oi.openInterest?.toLocaleString() ?? '--'}
        </div>
      </div>

      <div>
        <div className="text-gray-400">VOL</div>

        <div className="text-green-400 font-semibold">
          {vol.volume?.toLocaleString() ?? '--'}
        </div>
      </div>

      <div>
        <div className="text-gray-400">FUNDING RATE</div>

        <div className="text-green-400 font-semibold">
          {fund.fundingRate?.toFixed(4) ?? '--'}
        </div>
      </div>
    </div>
  )
}
