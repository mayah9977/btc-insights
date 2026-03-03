'use client'

import React, { useEffect, useMemo } from 'react'
import { ActionGateStatus } from '@/components/system/ActionGateStatus'
import { ActionGateRenderer } from '@/components/market/interpretation'
import { useMasterMarketStore } from '@/lib/market/store/masterMarketStore'

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

  // ✅ 0️⃣ Master Stream 구독 (SSE → Zustand)
  useMasterMarketStream(symbol)

  // ✅ Zustand store 구독 (Reactive)
  const masterState = useMasterMarketStore((s) => s.state)

  const gate = masterState?.actionGate ?? 'OBSERVE'

  // 🔥 MARKET_STATE 수신 확인 로그
  useEffect(() => {
    console.log('[VIP MARKET_STATE RECEIVED]', {
      symbol,
      gate,
    })
  }, [gate, symbol])

  // 2️⃣ Confirmed (30m close)
  const confirmed = useRealtimeBollingerSignal()

  // 3️⃣ Live (진행 중 30m)
  const live = useLiveBollingerCommentary()

  // 4️⃣ UI 병합 로직
  const effectiveSignal = useMemo(() => {
    if (
      confirmed?.signalType ===
      BollingerSignalType.INSIDE_LOWER_TOUCH_OR_BREAK
    ) {
      return confirmed
    }
    return confirmed ?? live
  }, [confirmed, live])

  // 디버그 로그
  useEffect(() => {
    console.log(
      '[DEBUG][VIPActionGate] CONFIRMED:',
      confirmed?.signalType ?? null,
      '| LIVE:',
      live?.signalType ?? null,
      '| EFFECTIVE:',
      effectiveSignal?.signalType ?? null,
    )
  }, [confirmed, live, effectiveSignal])

  return (
    <div style={{ display: 'grid', gap: '8px' }}>
      <ActionGateStatus state={gate} symbol={symbol} />

      <ActionGateRenderer
        gate={gate}
        signalType={effectiveSignal?.signalType}
      />
    </div>
  )
}
