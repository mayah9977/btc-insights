'use client'

import React from 'react'
import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

export default function VIPWhaleMiniCharts() {

  /* =========================
     Zustand Selectors
  ========================= */

  const whaleIntensity = useVIPMarketStore(
    (s) => s.whaleIntensity
  )

  const whaleNet = useVIPMarketStore(
    (s) => s.whaleNet
  )

  /* =========================
     Derived Values
  ========================= */

  const intensityPercent =
    Math.min(Math.max(whaleIntensity ?? 0, 0), 100)

  const flowPercent =
    Math.min(Math.abs(whaleNet ?? 0) * 100, 100)

  const flowColor =
    whaleNet > 0
      ? 'bg-emerald-500'
      : whaleNet < 0
      ? 'bg-blue-500'
      : 'bg-gray-500'

  const directionLabel =
    whaleNet > 0
      ? 'Buy Pressure'
      : whaleNet < 0
      ? 'Sell Pressure'
      : 'Neutral'

  /* =========================
     Render
  ========================= */

  return (
    <div className="px-4 space-y-4">

      {/* Whale Intensity */}

      <div className="text-xs">

        <div className="flex justify-between text-zinc-400 mb-1">
          <span>Whale Intensity</span>
          <span>{intensityPercent.toFixed(1)}%</span>
        </div>

        <div className="h-2 bg-zinc-800 rounded overflow-hidden">
          <div
            className="h-full bg-yellow-400 transition-all duration-300"
            style={{ width: `${intensityPercent}%` }}
          />
        </div>

      </div>

      {/* Whale Flow */}

      <div className="text-xs">

        <div className="flex justify-between text-zinc-400 mb-1">
          <span>Whale Flow ({directionLabel})</span>
          <span>{flowPercent.toFixed(1)}%</span>
        </div>

        <div className="h-2 bg-zinc-800 rounded overflow-hidden">
          <div
            className={`h-full ${flowColor} transition-all duration-300`}
            style={{ width: `${flowPercent}%` }}
          />
        </div>

      </div>

    </div>
  )
}
