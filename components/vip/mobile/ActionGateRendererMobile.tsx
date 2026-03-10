'use client'

import React from 'react'
import { BollingerSignalType } from '@/lib/market/actionGate/signalType'
import { BOLLINGER_SENTENCE_MAP } from '@/lib/market/actionGate/bollingerSentenceMap'

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
  signalType
}: Props) {

  const title =
    gate === 'OBSERVE'
      ? '시장 관측 구간'
      : gate === 'CAUTION'
      ? '시장 주의 구간'
      : '위험 구간'

  const description =
    gate === 'OBSERVE'
      ? '현재 시장은 비교적 안정적인 상태이며 AI 시스템이 시장을 관측하고 있습니다.'
      : gate === 'CAUTION'
      ? '시장 변동성이 증가하고 있으며 리스크 관리가 필요합니다.'
      : '현재 시장은 위험 구간으로 진입했으며 적극적인 리스크 관리가 필요합니다.'

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
        <div
          className="
            rounded-xl
            border
            border-zinc-800
            bg-zinc-900
            px-4
            py-4
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
      )}

    </div>
  )
}
