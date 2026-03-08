'use client'

import React from 'react'
import { useRealtimeOI } from '@/lib/realtime/useRealtimeOI'
import { useRealtimeVolume } from '@/lib/realtime/useRealtimeVolume'
import { useRealtimeFundingRate } from '@/lib/realtime/useRealtimeFundingRate'

interface Props {
  symbol: string
}

const Metric = ({
  label,
  value,
}: {
  label: string
  value: string | number
}) => {
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

const RawObservationBarMobile = ({ symbol }: Props) => {
  const oi = useRealtimeOI(symbol)
  const volume = useRealtimeVolume(symbol)
  const funding = useRealtimeFundingRate(symbol)

  const oiValue =
    oi.openInterest != null
      ? oi.openInterest.toFixed(0)
      : '-'

  const volumeValue =
    volume.volume != null
      ? volume.volume.toFixed(0)
      : '-'

  const fundingValue =
    funding.fundingRate != null
      ? `${(funding.fundingRate * 100).toFixed(3)}%`
      : '-'

  return (
    <div className="px-4 py-4 border-b border-zinc-800">
      <div className="grid grid-cols-3 gap-3">

        <Metric label="Open Interest" value={oiValue} />

        <Metric label="Volume" value={volumeValue} />

        <Metric label="Funding" value={fundingValue} />

      </div>
    </div>
  )
}

export default React.memo(RawObservationBarMobile)
