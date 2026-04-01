'use client'

import React, { useEffect, useState } from 'react'
import { ActionGateStatus } from '@/components/system/ActionGateStatus'
import { ActionGateRenderer } from '@/components/market/interpretation'
import { useMasterMarketStore } from '@/lib/market/store/masterMarketStore'
import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'
import { BollingerSignalType } from '@/lib/market/actionGate/signalType'
import type { FinalNarrativeReport } from '@/lib/market/narrative/types'

interface Props {
  symbol: string
  signalType?: BollingerSignalType
  sentence: FinalNarrativeReport | null
}

export const VIPActionGateContextBar: React.FC<Props> = ({
  symbol,
  signalType,
  sentence,
}) => {
  const [actionGate, setActionGate] = useState('OBSERVE')
  const [vipGate, setVipGate] = useState('OBSERVE')
  const [stableSignal, setStableSignal] =
    useState(signalType)

  useEffect(() => {
    const unsub1 = useMasterMarketStore.subscribe((s) =>
      setActionGate(s.actionGate)
    )
    const unsub2 = useVIPMarketStore.subscribe((s) =>
      setVipGate(s.actionGateState)
    )

    return () => {
      unsub1()
      unsub2()
    }
  }, [])

  useEffect(() => {
    if (signalType === stableSignal) return
    setStableSignal(signalType)
  }, [signalType])

  const gate = (vipGate ?? actionGate ?? 'OBSERVE') as any

  return (
    <div style={{ display: 'grid', gap: '8px' }}>
      <ActionGateStatus symbol={symbol} />

      <ActionGateRenderer
        signalType={stableSignal}
      />
    </div>
  )
}
