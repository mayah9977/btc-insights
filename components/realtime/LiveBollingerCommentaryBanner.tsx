'use client'

import { useLiveBollingerCommentary } from '@/lib/realtime/useLiveBollingerCommentary'
import { BOLLINGER_SENTENCE_MAP } from '@/lib/market/actionGate/bollingerSentenceMap'
import { BollingerSignalType } from '@/lib/market/actionGate/signalType'

export function LiveBollingerCommentaryBanner() {
  const live = useLiveBollingerCommentary()

  if (!live) return null

  const sentence =
    BOLLINGER_SENTENCE_MAP[live.signalType as BollingerSignalType]

  return (
    <div className="mt-2 rounded-lg bg-slate-800/40 px-4 py-2 text-sm text-slate-200 border border-slate-700/40">
      <span className="opacity-90">
        {sentence.description}
      </span>
    </div>
  )
}
