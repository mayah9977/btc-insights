'use client'

import {
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts'

type Props = {
  data: { value: number }[]
}

export default function PerformanceMiniChart({ data }: Props) {
  if (!data || data.length === 0) return null

  return (
    <div
      className="
        w-24
        min-h-[40px]
        h-[40px]
        flex
        items-center
      "
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            stroke="rgba(99,102,241,0.85)"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
