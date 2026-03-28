'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'
import { vipSound } from '@/lib/sound/vipSoundSystem'
import VIPSignalCard from './VIPSignalCard'
import { getMarketSnapshot } from '@/lib/market/engine/marketSnapshot'

export default function VIPWhaleMiniCharts() {

  /* =========================
     Zustand Selectors
  ========================= */

  const snapshot = getMarketSnapshot()

  const whaleIntensity = snapshot.whaleIntensity ?? 0
  const whaleNet = (snapshot.whaleNetRatio ?? 0) * 100

  const prevIntensity = useRef<number>(0)
  const prevFlow = useRef<number>(0)

  const [intensityTrigger, setIntensityTrigger] = useState(0)
  const [flowTrigger, setFlowTrigger] = useState(0)

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
     🔊 Sound Triggers
  ========================= */

  useEffect(() => {

    if (
      prevIntensity.current < 60 &&
      intensityPercent >= 60
    ) {
      vipSound.play('signal')
      setIntensityTrigger(Date.now())
    }

    if (
      prevIntensity.current < 80 &&
      intensityPercent >= 80
    ) {
      vipSound.play('signal')
      setIntensityTrigger(Date.now())
    }

    prevIntensity.current = intensityPercent

  }, [intensityPercent])


  useEffect(() => {

    if (
      Math.abs(prevFlow.current) < 0.4 &&
      Math.abs(whaleNet) >= 0.4
    ) {
      vipSound.play('signal')
      setFlowTrigger(Date.now())
    }

    prevFlow.current = whaleNet

  }, [whaleNet])


  /* =========================
     Render
  ========================= */

  return (
    <div className="space-y-4">

      {/* Whale Intensity */}
      <VIPSignalCard trigger={intensityTrigger}>
        <div className="text-xs mx-4">

          <div className="flex justify-between text-zinc-400 mb-1">
            <span>Whale Intensity(기관급 고래체결강도)</span>
            <span>{intensityPercent.toFixed(1)}%</span>
          </div>

          <div className="h-2 bg-zinc-800 rounded overflow-hidden">
            <div
              className="h-full bg-yellow-400 transition-all duration-300"
              style={{ width: `${intensityPercent}%` }}
            />
          </div>

        </div>
      </VIPSignalCard>

      {/* Whale Flow */}
      <VIPSignalCard trigger={flowTrigger}>
        <div className="text-xs mx-4">

          <div className="flex justify-between text-zinc-400 mb-1">

            <span>
              Whale Flow(기관급 자금흐름) ({directionLabel})
            </span>

            <span>
              {flowPercent.toFixed(1)}%
            </span>

          </div>

          <div className="h-2 bg-zinc-800 rounded overflow-hidden">
            <div
              className={`h-full ${flowColor} transition-all duration-300`}
              style={{ width: `${flowPercent}%` }}
            />
          </div>

        </div>
      </VIPSignalCard>

    </div>
  )
}
