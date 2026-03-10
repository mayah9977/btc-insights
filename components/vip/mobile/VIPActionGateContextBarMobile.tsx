'use client'

import React, { useMemo } from 'react'

import ActionGateStatusMobile from './ActionGateStatusMobile'
import ActionGateRendererMobile from './ActionGateRendererMobile'

import { useVIPMarketStore } from '@/lib/market/store/vipMarketStore'
import { useMasterMarketStore } from '@/lib/market/store/masterMarketStore'

import { useRealtimeBollingerSignal } from '@/lib/realtime/useRealtimeBollingerSignal'
import { useLiveBollingerCommentary } from '@/lib/realtime/useLiveBollingerCommentary'

import { BollingerSignalType } from '@/lib/market/actionGate/signalType'

interface Props {
  symbol: string
}

export default function VIPActionGateContextBarMobile({
  symbol
}: Props) {

  /* =========================
     Gate State
  ========================= */

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

  /* =========================
     Bollinger Signal
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
     Render
  ========================= */

  return (
    <div className="space-y-3 px-4">

      <ActionGateStatusMobile
        symbol={symbol}
      />

      <ActionGateRendererMobile
        gate={gate as any}
        signalType={effectiveSignal?.signalType}
      />

    </div>
  )
}
