'use client'

import React, { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts'

import { useWhaleTradeFlow } from '@/lib/realtime/useWhaleTradeFlow'

type Point = {
  t: number
  v: number
}

const VIPWhaleTradeFlowChartMobile = ({
  symbol = 'BTCUSDT',
}: {
  symbol?: string
}) => {
  const { history } = useWhaleTradeFlow({
    symbol,
    limit: 30,
  })

  const [data, setData] = useState<Point[]>([])

  useEffect(() => {
    const id = setInterval(() => {
      const last = history.at(-1)

      setData(prev => {
        const next = [
          ...prev,
          {
            t: Date.now(),
            v: last?.ratio ?? 0,
          },
        ]

        return next.slice(-30)
      })
    }, 1000)

    return () => clearInterval(id)
  }, [history])

  return (
    <div className="rounded-lg border border-zinc-800 p-3">
      <div className="text-xs text-zinc-400 mb-2">
        Whale Trade Flow
      </div>

      <div className="h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line
              dataKey="v"
              stroke="#facc15"
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

export default React.memo(VIPWhaleTradeFlowChartMobile)
