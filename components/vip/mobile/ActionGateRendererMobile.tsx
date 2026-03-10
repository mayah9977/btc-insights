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
      ? 'AI is observing the market.'
      : gate === 'CAUTION'
      ? 'AI is observing the market.'
      : 'AI is observing the market.'

  const description =
    gate === 'OBSERVE'
      ? '현재 실시간데이터(고래움직임/체결량/거래량/온체인데이터/ Open Interest/Funding rate 등)를 기반으로 시장상황을 관찰중에 있습니다.'
      : gate === 'CAUTION'
      ? '현재 실시간데이터(고래움직임/체결량/거래량/온체인데이터/ Open Interest/Funding rate 등)를 기반으로 시장상황을 관찰중에 있습니다.'
      : '현재 실시간데이터(고래움직임/체결량/거래량/온체인데이터/ Open Interest/Funding rate 등)를 기반으로 시장상황을 관찰중에 있습니다.'

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
