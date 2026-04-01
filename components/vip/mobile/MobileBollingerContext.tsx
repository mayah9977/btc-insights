 'use client'

import { useTypewriter } from '@/hooks/useTypewriter'
import { usePremiumSignalAnimation } from '@/hooks/usePremiumSignalAnimation'
import { BollingerSignalType } from '@/lib/market/actionGate/signalType'

type Props = {
  signalType?: BollingerSignalType
  sentence: any
}

export default function MobileBollingerContext({
  signalType,
  sentence,
}: Props) {
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

  if (!signalType || !sentence) return null

  return (
    <div className="mx-4 relative">
      {flash && (
        <div className="absolute inset-0 bg-yellow-500/20 animate-pulse rounded-xl" />
      )}

      <div className="rounded-xl border bg-zinc-900 p-4 text-sm space-y-3">
        <div className="text-yellow-400 font-semibold">
          {typedSummary}
        </div>

        <div className="text-gray-300 text-xs">
          {typedDescription}
        </div>

        <div className="text-gray-500 text-xs italic">
          {typedTendency}
        </div>
      </div>
    </div>
  )
}
