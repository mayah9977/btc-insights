'use client'

import React, { useEffect, useRef, useState } from 'react'
import { vipSound } from '@/lib/sound/vipSoundSystem'
import VIPSignalCard from './VIPSignalCard'

type Props = {
  long: number
  short: number
  confidence: number
  dominant: 'LONG' | 'SHORT' | 'NONE'
  intensity: number
}

/* =========================================================
   🔥 UI Safety (전체 방어)
========================================================= */
const safePercent = (v: number) => {
  if (!Number.isFinite(v)) return 0

  // 비정상 값 차단 (폭발 방지)
  if (Math.abs(v) > 1000) return 0

  return v
}

const safeRatioToPercent = (v: number) => {
  if (!Number.isFinite(v)) return 0

  // ratio 기반이면 % 변환
  if (Math.abs(v) <= 1) return v * 100

  // 이미 %인데 이상값이면 컷
  if (Math.abs(v) > 1000) return 0

  return v
}

export default function VIPInstitutionalGuideCardMobile({
  long,
  short,
  confidence,
  dominant,
  intensity,
}: Props) {
  const prevConfidence = useRef<number>(0)

  /* animation trigger */
  const [trigger, setTrigger] = useState(0)

  /* =========================
     🔊 Sound Trigger
  ========================= */
  useEffect(() => {
    if (
      confidence >= 65 &&
      prevConfidence.current < 65
    ) {
      vipSound.play('signal')
      setTrigger(Date.now())
    }

    prevConfidence.current = confidence
  }, [confidence])

  /* =========================
     🔥 안전 값 변환
  ========================= */
  const safeLong = safePercent(long)
  const safeShort = safePercent(short)
  const safeConfidence = safePercent(confidence)
  const safeIntensity = safeRatioToPercent(intensity)

  /* =========================
     Derived Values
  ========================= */
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
      : '시장관찰중'

  const gauge = Math.min(safeConfidence, 100)

  /* =========================
     Render
  ========================= */
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
            기관급 자금 흐름강도
          </div>

          <div className={`font-semibold ${color}`}>
            {label}
          </div>
        </div>

        <div className="text-xs text-gray-400">
          매수예상 {safeLong.toFixed(0)}% | 매도예상 {safeShort.toFixed(0)}%
        </div>

        <div className="text-xs text-gray-400">
          Whale Intensity(고래체결강도){' '}
          {safeIntensity.toFixed(1)}%
        </div>

        <div className="h-2 bg-zinc-800 rounded overflow-hidden">
          <div
            className="h-full bg-emerald-400"
            style={{ width: `${gauge}%` }}
          />
        </div>

        <div className="text-xs text-gray-500">
          고래확정확율 {safeConfidence.toFixed(1)}%
        </div>
      </div>
    </VIPSignalCard>
  )
}
