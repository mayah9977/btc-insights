'use client'

import { useMemo } from 'react'

import { useRealtimeBollingerSignal } from '@/lib/realtime/useRealtimeBollingerSignal'
import { useLiveBollingerCommentary } from '@/lib/realtime/useLiveBollingerCommentary'

import { BollingerSignalType } from '@/lib/market/actionGate/signalType'
import { BOLLINGER_SENTENCE_MAP } from '@/lib/market/actionGate/bollingerSentenceMap'

import { useTypewriter } from '@/hooks/useTypewriter'
import { usePremiumSignalAnimation } from '@/hooks/usePremiumSignalAnimation'

export default function MobileBollingerContext() {
  const confirmed = useRealtimeBollingerSignal()
  const live = useLiveBollingerCommentary()

  const signal = useMemo(() => {
    if (
      confirmed?.signalType ===
      BollingerSignalType.INSIDE_LOWER_TOUCH_OR_BREAK
    ) {
      return confirmed
    }

    return confirmed ?? live
  }, [confirmed, live])

  const signalType = signal?.signalType
  const sentence = signalType
    ? BOLLINGER_SENTENCE_MAP[signalType]
    : null

  /* 항상 호출 */
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

  if (!signal || !sentence) return null

  return (
    <div className="mx-4 relative">
      {flash && (
        <div
          className="
          absolute inset-0
          bg-gradient-to-r
          from-transparent
          via-yellow-500/20
          to-transparent
          animate-pulse
          pointer-events-none
          rounded-xl
          "
        />
      )}

      <div
        className={`
        rounded-xl
        border
        border-zinc-800
        bg-zinc-900
        p-4
        text-sm
        space-y-3
        transition-all
        duration-500
        ${flash ? 'shadow-[0_0_25px_rgba(250,204,21,0.35)]' : ''}
        ${pulse ? 'animate-pulse' : ''}
        ${transition ? 'scale-[1.02]' : ''}
        `}
      >
        <div className="text-yellow-400 font-semibold text-sm tracking-wide">
          {typedSummary}
        </div>

        <div className="text-gray-300 text-xs leading-relaxed">
          {typedDescription}
        </div>

        <div className="text-gray-500 text-xs italic">
          {typedTendency}
        </div>
      </div>
    </div>
  )
}
