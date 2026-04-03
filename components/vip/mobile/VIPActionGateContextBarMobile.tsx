'use client'

import React from 'react'

import ActionGateStatusMobile from './ActionGateStatusMobile'
import ActionGateRendererMobile from './ActionGateRendererMobile'

import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'
import { useMasterMarketStore } from '@/lib/market/store/masterMarketStore'

import { BollingerSignalType } from '@/lib/market/actionGate/signalType'
import type { FinalNarrativeReport } from '@/lib/market/narrative/types'

interface Props {
  symbol: string
  signalType?: BollingerSignalType
  sentence: FinalNarrativeReport | null
}

export default function VIPActionGateContextBarMobile({
  symbol,
  signalType,
  sentence,
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
    <div className="space-y-3">
      <ActionGateStatusMobile
        symbol={symbol}
      />

      <ActionGateRendererMobile
        gate={gate as any}
        signalType={signalType}
        sentence={sentence}
      />
    </div>
  )
}
