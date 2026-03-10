'use client'

import React from 'react'
import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

export type ActionGateState =
  | 'OBSERVE'
  | 'CAUTION'
  | 'IGNORE'

interface Props {
  symbol?: string
}

export default function ActionGateStatusMobile({
  symbol
}: Props) {

  const state = useVIPMarketStore(
    (s) => s.actionGateState
  ) as ActionGateState

  const bg =
    state === 'OBSERVE'
      ? 'bg-emerald-900/30'
      : state === 'CAUTION'
      ? 'bg-yellow-900/30'
      : 'bg-red-900/30'

  const border =
    state === 'OBSERVE'
      ? 'border-emerald-500'
      : state === 'CAUTION'
      ? 'border-yellow-500'
      : 'border-red-500'

  const text =
    state === 'OBSERVE'
      ? 'text-emerald-400'
      : state === 'CAUTION'
      ? 'text-yellow-400'
      : 'text-red-400'

  const label =
    state === 'OBSERVE'
      ? '시장 정상 관측'
      : state === 'CAUTION'
      ? '주의 필요'
      : '위험 구간'

  return (
    <div
      className={`
        rounded-lg
        border
        px-4
        py-3
        text-sm
        flex
        items-center
        justify-between
        ${bg}
        ${border}
      `}
    >
      <div className="font-semibold text-white">
        AI Gate
      </div>

      <div className={`font-bold ${text}`}>
        {state}
      </div>

      <div className="text-xs text-gray-400">
        {label}
      </div>
    </div>
  )
}
