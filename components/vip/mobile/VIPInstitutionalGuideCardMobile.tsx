'use client'

import React from 'react'

type Props = {
  long: number
  short: number
  confidence: number
  dominant: 'LONG' | 'SHORT' | 'NONE'
  intensity: number
}

export default function VIPInstitutionalGuideCardMobile({
  long,
  short,
  confidence,
  dominant,
  intensity
}: Props) {

  const color =
    dominant === 'LONG'
      ? 'text-emerald-400'
      : dominant === 'SHORT'
      ? 'text-blue-400'
      : 'text-gray-400'

  const label =
    dominant === 'LONG'
      ? '매수 우위'
      : dominant === 'SHORT'
      ? '매도 우위'
      : '중립'

  const gauge = Math.min(confidence, 100)

  return (
    <div
      className="
      mx-4
      rounded-xl
      border
      border-zinc-800
      bg-zinc-900
      p-4
      text-sm
      space-y-3
    "
    >
      <div className="flex justify-between">

        <div className="font-semibold text-white">
          기관 자금 흐름
        </div>

        <div className={`font-semibold ${color}`}>
          {label}
        </div>

      </div>

      <div className="text-xs text-gray-400">
        매수 {long.toFixed(0)}% |
        매도 {short.toFixed(0)}%
      </div>

      <div className="text-xs text-gray-400">
        Whale Intensity {intensity.toFixed(1)}%
      </div>

      <div className="h-2 bg-zinc-800 rounded overflow-hidden">

        <div
          className="h-full bg-emerald-400"
          style={{ width: `${gauge}%` }}
        />

      </div>

      <div className="text-xs text-gray-500">
        신뢰도 {confidence.toFixed(1)}%
      </div>

    </div>
  )
}
