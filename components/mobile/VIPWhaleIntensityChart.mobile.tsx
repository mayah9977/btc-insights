'use client'

import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'
import { useEffect, useState } from 'react'

export default function VIPWhaleIntensityChartMobile() {

  const intensity = useVIPMarketStore((s) => s.whaleIntensity)

  const [history, setHistory] = useState<number[]>([])

  useEffect(() => {

    const id = setInterval(() => {

      setHistory((h) => {
        const next = [...h, intensity]
        return next.slice(-30)
      })

    }, 1000)

    return () => clearInterval(id)

  }, [intensity])

  return (
    <div className="border border-zinc-800 rounded-lg p-3">

      <div className="text-xs text-zinc-400 mb-2">
        Whale Intensity
      </div>

      <div className="text-sm text-white">
        {history.at(-1) ?? 0}
      </div>

    </div>
  )
}
