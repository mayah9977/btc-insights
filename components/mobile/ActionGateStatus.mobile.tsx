'use client'

import React from 'react'
import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

type ActionGateState = 'OBSERVE' | 'CAUTION' | 'IGNORE'

function ActionGateStatusMobile() {

  const state = useVIPMarketStore(
    (s) => s.actionGateState
  ) as ActionGateState

  const color =
    state === 'IGNORE'
      ? 'bg-red-500'
      : state === 'CAUTION'
      ? 'bg-yellow-400'
      : 'bg-emerald-400'

  return (
    <div className="border border-zinc-700 rounded-lg px-4 py-3 flex items-center gap-2">

      <div className={`w-3 h-3 rounded-full ${color}`} />

      <span className="text-sm font-semibold text-white">
        AI Gate: {state}
      </span>

    </div>
  )
}

export default React.memo(ActionGateStatusMobile)
