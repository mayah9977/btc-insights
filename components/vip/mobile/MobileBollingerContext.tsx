'use client'

import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

import { useRealtimeBollingerSignal } from '@/lib/realtime/useRealtimeBollingerSignal'
import { useLiveBollingerCommentary } from '@/lib/realtime/useLiveBollingerCommentary'

import { BollingerSignalType } from '@/lib/market/actionGate/signalType'
import { BOLLINGER_SENTENCE_MAP } from '@/lib/market/actionGate/bollingerSentenceMap'

/* Narrative Engine */
import { generateNarrative } from '@/lib/market/narrative/generateNarrative'

import { useTypewriter } from '@/hooks/useTypewriter'
import { usePremiumSignalAnimation } from '@/hooks/usePremiumSignalAnimation'

export default function MobileBollingerContext() {
  const confirmed = useRealtimeBollingerSignal()
  const live = useLiveBollingerCommentary()

  /* ======================================================
     🔥 Store 기반 준비 상태
  ====================================================== */
  const isReady = useVIPMarketStore((s) => {
    return (
      s.ts > 0 &&
      (s.oiDelta !== 0 ||
        s.volumeRatio !== 1 ||
        s.fundingRate !== 0 ||
        s.whaleNetRatio !== 0)
    )
  })

  /* ======================================================
     Signal Selection (useMemo 제거)
  ====================================================== */
  const signal =
    confirmed?.signalType ===
    BollingerSignalType.INSIDE_LOWER_TOUCH_OR_BREAK
      ? confirmed
      : confirmed ?? live

  const signalType = signal?.signalType

  /* ======================================================
     🔥 Narrative (useMemo 제거)
  ====================================================== */
  const sentence =
    signalType && isReady
      ? generateNarrative(
          BOLLINGER_SENTENCE_MAP[signalType],
          signalType
        )
      : null

  /* ======================================================
     ✅ Animation (요청대로 그대로 유지)
  ====================================================== */
  const { flash, pulse, transition } =
    usePremiumSignalAnimation(signalType)

  /* ======================================================
     🔥 Typewriter 최적화
  ====================================================== */
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
        key={signalType}
        className="
        rounded-xl
        border
        border-zinc-800
        bg-zinc-900
        p-4
        text-sm
        space-y-3
        transition-all
        duration-500
        "
      >
        {/* SUMMARY */}
        <div className="text-yellow-400 font-semibold text-sm tracking-wide">
          {typedSummary}
        </div>

        {/* DESCRIPTION */}
        <div className="text-gray-300 text-xs leading-relaxed">
          {typedDescription}
        </div>

        {/* TENDENCY */}
        <div className="text-gray-500 text-xs italic">
          {typedTendency}
        </div>
      </div>
    </div>
  )
}
