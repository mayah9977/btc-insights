'use client'

import React from 'react'

import ActionGateStatusMobile from './ActionGateStatusMobile'
import ActionGateRendererMobile from './ActionGateRendererMobile'

import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'
import { useMasterMarketStore } from '@/lib/market/store/masterMarketStore'

interface Props {
  symbol: string
}

export default function VIPActionGateContextBarMobile({
  symbol
}: Props) {

  const vipGate = useVIPMarketStore(
    (s) => s.actionGateState
  )

  const masterGate = useMasterMarketStore(
    (s) => s.actionGate
  )

  const gate =
    vipGate ??
    masterGate ??
    'OBSERVE'

  return (
    <div className="space-y-3 px-4">

      <ActionGateStatusMobile
        symbol={symbol}
      />

      <ActionGateRendererMobile
        gate={gate as any}
      />

    </div>
  )
}
