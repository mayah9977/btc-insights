'use client'

import { useMemo } from 'react'

import { useRealtimeBollingerSignal } from '@/lib/realtime/useRealtimeBollingerSignal'
import { useLiveBollingerCommentary } from '@/lib/realtime/useLiveBollingerCommentary'

import { BollingerSignalType } from '@/lib/market/actionGate/signalType'
import { BOLLINGER_SENTENCE_MAP } from '@/lib/market/actionGate/bollingerSentenceMap'

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

  if (!signal) return null

  const sentence = BOLLINGER_SENTENCE_MAP[signal.signalType]

  if (!sentence) return null

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
      space-y-2
    "
    >

      <div className="text-yellow-400 font-semibold">
        {sentence.summary}
      </div>

      <div className="text-gray-300 text-xs leading-relaxed">
        {sentence.description}
      </div>

      <div className="text-gray-500 text-xs">
        {sentence.tendency}
      </div>

    </div>
  )
}
