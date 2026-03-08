'use client'

import React from 'react'

type Props = {
  data: number[]
  color?: string
  height?: number
}

export default function Sparkline({
  data,
  color = '#22c55e',
  height = 60,
}: Props) {
  if (data.length < 2) return null

  const max = Math.max(...data)
  const min = Math.min(...data)

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100
      const y = 100 - ((v - min) / (max - min || 1)) * 100
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg viewBox="0 0 100 100" height={height} width="100%">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
      />
    </svg>
  )
}
