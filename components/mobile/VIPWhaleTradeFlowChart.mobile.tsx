'use client'

import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'
import { useEffect, useState } from 'react'

export default function VIPWhaleTradeFlowChartMobile() {

  const net = useVIPMarketStore((s) => s.whaleNet)

  const [history, setHistory] = useState<number[]>([])

  useEffect(() => {

    const id = setInterval(() => {

      setHistory((h) => {
        const next = [...h, net]
        return next.slice(-30)
      })

    }, 1000)

    return () => clearInterval(id)

  }, [net])

  return (
    <div className="border border-zinc-800 rounded-lg p-3">

      <div className="text-xs text-zinc-400 mb-2">
        Whale Trade Flow
      </div>

      <div className="text-sm text-white">
        {history.at(-1) ?? 0}
      </div>

    </div>
  )
}
