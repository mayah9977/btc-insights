'use client'

import React from 'react'
import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

function Metric({
  label,
  value,
}: {
  label: string
  value: string | number
}) {
  return (
    <div className="flex flex-col items-center gap-1">

      <span className="text-[11px] text-zinc-400 uppercase">
        {label}
      </span>

      <span className="text-sm font-semibold text-white">
        {value}
      </span>

    </div>
  )
}

export default function RawObservationBarMobile() {

  const oi = useVIPMarketStore((s) => s.whaleRatio)
  const volume = useVIPMarketStore((s) => s.whaleIntensity)
  const fundingRate = useVIPMarketStore((s) => s.fmai)

  const oiValue = oi != null ? Number(oi).toFixed(0) : '-'
  const volumeValue = volume != null ? Number(volume).toFixed(0) : '-'
  const fundingValue =
    fundingRate != null
      ? `${(fundingRate * 100).toFixed(3)}%`
      : '-'

  return (
    <div className="px-4 py-4 border-b border-zinc-800">

      <div className="grid grid-cols-3 gap-3">

        <Metric label="OI" value={oiValue} />

        <Metric label="VOL" value={volumeValue} />

        <Metric label="FUND" value={fundingValue} />

      </div>

    </div>
  )
}
