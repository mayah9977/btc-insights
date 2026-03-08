'use client'

import React, { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts'

import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

type Point = {
  t: number
  v: number
}

const VIPWhaleIntensityChartMobile = () => {
  const intensity = useVIPMarketStore(
    s => s.whaleIntensity
  )

  const [data, setData] = useState<Point[]>([])

  useEffect(() => {
    const id = setInterval(() => {
      setData(prev => {
        const next = [
          ...prev,
          { t: Date.now(), v: intensity },
        ]

        return next.slice(-30)
      })
    }, 1000)

    return () => clearInterval(id)
  }, [intensity])

  return (
    <div className="rounded-lg border border-zinc-800 p-3">
      <div className="text-xs text-zinc-400 mb-2">
        Whale Intensity
      </div>

      <div className="h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line
              dataKey="v"
              stroke="#ef4444"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

export default React.memo(VIPWhaleIntensityChartMobile)
