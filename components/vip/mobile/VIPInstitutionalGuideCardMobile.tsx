'use client'

import React, {
  useEffect,
  useRef,
  useState,
} from 'react'

import { vipSound }
  from '@/lib/sound/vipSoundSystem'

import VIPSignalCard
  from './VIPSignalCard'

type Props = {
  long: number
  short: number
  confidence: number
  dominant:
    | 'LONG'
    | 'SHORT'
    | 'NONE'
  intensity: number
}

export default function VIPInstitutionalGuideCardMobile({
  long,
  short,
  confidence,
  dominant,
  intensity,
}: Props) {

  const prevConfidence =
    useRef<number>(0)

  const [trigger, setTrigger] =
    useState(0)

  useEffect(() => {

    if (
      confidence >= 65 &&
      prevConfidence.current < 65
    ) {

      vipSound.play('signal')

      setTrigger(Date.now())
    }

    prevConfidence.current =
      confidence

  }, [confidence])

  const color =
    dominant === 'LONG'
      ? 'text-emerald-400'
      : dominant === 'SHORT'
      ? 'text-blue-400'
      : 'text-gray-400'

  const label =
    dominant === 'LONG'
      ? 'LONG Conviction'
      : dominant === 'SHORT'
      ? 'SHORT Conviction'
      : 'Neutral'

  const gauge =
    Math.min(confidence, 100)

  return (
    <VIPSignalCard trigger={trigger}>

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
            Institutional Conviction(기관 방향성)
          </div>

          <div
            className={`font-semibold ${color}`}
          >
            {label}
          </div>

        </div>

        <div className="text-xs text-gray-400">
          LONG Probability(매수 우세) {long.toFixed(0)}%
          {' | '}
          SHORT Probability(매도 우세) {short.toFixed(0)}%
        </div>

        <div className="text-xs text-gray-400">
          Institutional Intervention Energy(세력 개입 강도)
          {' '}
          {intensity.toFixed(1)}%
        </div>

        <div className="h-2 bg-zinc-800 rounded overflow-hidden">

          <div
            className="h-full bg-emerald-400"
            style={{
              width: `${gauge}%`,
            }}
          />

        </div>

        <div className="text-xs text-gray-500">
          Directional Conviction(추세 확신)
          {' '}
          {confidence.toFixed(1)}%
        </div>

      </div>

    </VIPSignalCard>
  )
}
