'use client'

import React from 'react'
import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

type ActionGateState = 'OBSERVE' | 'CAUTION' | 'IGNORE'

function getColor(state: ActionGateState) {
  switch (state) {
    case 'IGNORE':
      return 'bg-red-500'
    case 'CAUTION':
      return 'bg-yellow-400'
    default:
      return 'bg-emerald-400'
  }
}

function getBorder(state: ActionGateState) {
  switch (state) {
    case 'IGNORE':
      return 'border-red-500/60'
    case 'CAUTION':
      return 'border-yellow-400/60'
    default:
      return 'border-emerald-400/60'
  }
}

const ActionGateStatusMobile = () => {
  const state = useVIPMarketStore(
    s => s.actionGateState
  ) as ActionGateState

  return (
    <div
      className={`rounded-lg border px-4 py-3 flex items-center gap-3 ${getBorder(
        state
      )}`}
    >
      <div
        className={`w-3 h-3 rounded-full ${getColor(state)}`}
      />

      <span className="text-sm text-white font-semibold">
        AI Gate: {state}
      </span>
    </div>
  )
}

export default React.memo(ActionGateStatusMobile)
