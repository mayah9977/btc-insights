'use client'

import { useRealtimeBollingerSignal } from '@/lib/realtime/useRealtimeBollingerSignal'
import { BollingerSignalType } from '@/lib/market/actionGate/signalType'

export default function BBSignalCard() {
  const signal = useRealtimeBollingerSignal()

  if (!signal?.enabled) return null

  const type = signal.signalType as BollingerSignalType

  return (
    <section
      className="
        rounded-xl
        border border-zinc-800
        bg-zinc-900/40
        p-4
        space-y-2
      "
    >
      <div className="text-[11px] tracking-widest uppercase text-zinc-500">
        Bollinger Structure Observation
      </div>

      <div className="text-sm text-zinc-200 leading-relaxed">
        Bollinger Structure · {type}
      </div>

      {typeof signal.at === 'number' && (
        <div className="text-xs text-zinc-500">
          {new Date(signal.at).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </div>
      )}
    </section>
  )
}
