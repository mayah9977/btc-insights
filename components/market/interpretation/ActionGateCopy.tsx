'use client'

import { ActionGateState } from '@/components/system/ActionGateStatus'
import { useRealtimeBollingerSignal } from '@/lib/realtime/useRealtimeBollingerSignal'
import { BOLLINGER_SENTENCE_MAP } from '@/lib/market/actionGate/bollingerSentenceMap'
import { BollingerSignalType } from '@/lib/market/actionGate/signalType'

interface Props {
  gate: ActionGateState
}

/**
 * ActionGateCopy
 *
 * SSOT 해석 전용 컴포넌트
 */

export function ActionGateCopy({ gate }: Props) {
  if (gate === 'IGNORE') return null

  const bbSignal = useRealtimeBollingerSignal()

  /* ======================================================
   * 1️⃣ Bollinger 구조 기반 해석 (최우선)
   * ====================================================== */
  if (
    bbSignal?.enabled === true &&
    bbSignal.signalType
  ) {
    const type =
      bbSignal.signalType as BollingerSignalType

    const sentence =
      BOLLINGER_SENTENCE_MAP[type] ??
      Object.values(BOLLINGER_SENTENCE_MAP)[0]

    if (!sentence) return null

    return (
      <div className="w-full text-sm md:text-base tracking-wide leading-relaxed text-white/90">
        <div className="font-medium">
          {sentence.summary}
        </div>
        <div className="mt-1 text-white/80">
          {sentence.description}
        </div>
        <div className="mt-1 text-white/60">
          {sentence.tendency}
        </div>
      </div>
    )
  }

  /* ======================================================
   * 2️⃣ ActionGateState fallback
   * ====================================================== */
  const fallbackSentence =
    '현재 실시간데이터(고래움직임/체결량/거래량/온체인데이터/ Open Interest/Funding rate 등)를 기반으로 시장상황을 관찰중에 있습니다.'

  return (
    <div className="w-full text-sm md:text-base tracking-wide leading-relaxed text-white/90">
      {fallbackSentence}
    </div>
  )
}
