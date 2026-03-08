'use client'

import React, { useMemo } from 'react'

import { ActionGateStatus } from '@/components/system/ActionGateStatus'
import { ActionGateRenderer } from '@/components/market/interpretation'

import { useMasterMarketStore } from '@/lib/market/store/masterMarketStore'
import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'

import { useRealtimeBollingerSignal } from '@/lib/realtime/useRealtimeBollingerSignal'
import { useLiveBollingerCommentary } from '@/lib/realtime/useLiveBollingerCommentary'
import { BollingerSignalType } from '@/lib/market/actionGate/signalType'

import { useMasterMarketStream } from '@/lib/realtime/useMasterMarketStream'

interface VIPActionGateContextBarProps {
  symbol: string
}

export const VIPActionGateContextBar: React.FC<
  VIPActionGateContextBarProps
> = ({ symbol }) => {

  /* =========================
     Stream Subscribe
  ========================= */

  useMasterMarketStream(symbol)

  /* =========================
     Zustand Selectors
  ========================= */

  const actionGate = useMasterMarketStore(
    (s) => s.actionGate
  )

  const vipGate = useVIPMarketStore(
    (s) => s.actionGateState
  )

  /* =========================
     Bollinger Signals
  ========================= */

  const confirmed = useRealtimeBollingerSignal()
  const live = useLiveBollingerCommentary()

  const effectiveSignal = useMemo(() => {

    if (
      confirmed?.signalType ===
      BollingerSignalType.INSIDE_LOWER_TOUCH_OR_BREAK
    ) {
      return confirmed
    }

    return confirmed ?? live

  }, [confirmed, live])

  /* =========================
     Gate Resolve
  ========================= */

  const gate =
    (vipGate ??
      actionGate ??
      'OBSERVE') as any

  /* =========================
     Render
  ========================= */

  return (
    <div style={{ display: 'grid', gap: '8px' }}>

      <ActionGateStatus symbol={symbol} />

      <ActionGateRenderer
        gate={gate}
        signalType={effectiveSignal?.signalType}
      />

    </div>
  )
}
