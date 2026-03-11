'use client'

import React from 'react'
import { BollingerSignalType } from '@/lib/market/actionGate/signalType'
import { BOLLINGER_SENTENCE_MAP } from '@/lib/market/actionGate/bollingerSentenceMap'

import { useTypewriter } from '@/hooks/useTypewriter'
import { usePremiumSignalAnimation } from '@/hooks/usePremiumSignalAnimation'

export type ActionGateState =
  | 'OBSERVE'
  | 'CAUTION'
  | 'IGNORE'

interface Props {
  gate: ActionGateState
  signalType?: BollingerSignalType
}

export default function ActionGateRendererMobile({
  gate,
  signalType,
}: Props) {

  const title =
    'AI is observing the market.'

  const description =
    '현재 실시간데이터(고래움직임/체결량/거래량/온체인데이터/ Open Interest/Funding rate 등)를 기반으로 시장상황을 관찰중에 있습니다.'

  const bg =
    gate === 'OBSERVE'
      ? 'bg-emerald-900/20 border-emerald-600/30'
      : gate === 'CAUTION'
      ? 'bg-yellow-900/20 border-yellow-600/30'
      : 'bg-red-900/20 border-red-600/30'

  const sentence =
    signalType
      ? BOLLINGER_SENTENCE_MAP[signalType]
      : null

  /* =========================
     Animation Hooks
  ========================= */

  const { flash, pulse, transition } =
    usePremiumSignalAnimation(signalType)

  const typedSummary = useTypewriter(
    sentence?.summary ?? '',
    10
  )

  const typedDescription = useTypewriter(
    sentence?.description ?? '',
    8
  )

  const typedTendency = useTypewriter(
    sentence?.tendency ?? '',
    12
  )

  return (
    <div className="space-y-3">

      {/* Action Gate */}

      <div
        className={`
          rounded-xl
          border
          px-4
          py-4
          text-sm
          ${bg}
        `}
      >
        <div className="font-semibold text-white mb-2">
          {title}
        </div>

        <div className="text-gray-300 leading-relaxed">
          {description}
        </div>
      </div>


      {/* Bollinger Interpretation */}

      {sentence && (
        <div className="relative">

          {/* Flash */}

          {flash && (
            <div
              className="
              absolute
              inset-0
              bg-gradient-to-r
              from-transparent
              via-yellow-500/20
              to-transparent
              animate-pulse
              rounded-xl
              pointer-events-none
              "
            />
          )}

          <div
            className={`
              rounded-xl
              border
              border-zinc-800
              bg-zinc-900
              px-4
              py-4
              text-sm
              space-y-2
              transition-all
              duration-500
              ${pulse ? 'animate-pulse' : ''}
              ${transition ? 'scale-[1.02]' : ''}
            `}
          >

            <div className="text-yellow-400 font-semibold">
              {typedSummary}
            </div>

            <div className="text-gray-300 text-xs leading-relaxed">
              {typedDescription}
            </div>

            <div className="text-gray-500 text-xs">
              {typedTendency}
            </div>

          </div>

        </div>
      )}

    </div>
  )
}
