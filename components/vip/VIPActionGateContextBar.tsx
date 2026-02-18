'use client'

import React, { useEffect, useMemo } from 'react'
import { ActionGateStatus } from '@/components/system/ActionGateStatus'
import { ActionGateRenderer } from '@/components/market/interpretation'
import { useActionGateState } from '@/lib/market/store/useActionGateState'

import { useRealtimeBollingerSignal } from '@/lib/realtime/useRealtimeBollingerSignal'
import { useLiveBollingerCommentary } from '@/lib/realtime/useLiveBollingerCommentary'
import { BollingerSignalType } from '@/lib/market/actionGate/signalType'

interface VIPActionGateContextBarProps {
  symbol: string
}

export const VIPActionGateContextBar: React.FC<
  VIPActionGateContextBarProps
> = ({ symbol }) => {
  // 1️⃣ Action Gate 상태
  const gate = useActionGateState(symbol)

  // 2️⃣ Confirmed (30m close)
  const confirmed = useRealtimeBollingerSignal()

  // 3️⃣ Live (진행 중 30m)
  const live = useLiveBollingerCommentary()

  // 4️⃣ 🔥 UI 전용 병합 로직
  // - 6번(긴급 급락)은 항상 최우선
  // - 그 외에는 confirmed 우선, 없으면 live
  const effectiveSignal = useMemo(() => {
    if (
      confirmed?.signalType ===
      BollingerSignalType.INSIDE_LOWER_TOUCH_OR_BREAK
    ) {
      return confirmed
    }
    return confirmed ?? live
  }, [confirmed, live])

  // ✅ 1️⃣ 가장 정확한 1차 체크: 실제 signalType 수치(값) 로그
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
      {/* 상태 표시 */}
      <ActionGateStatus state={gate} />

      {/* 🔥 최종 signalType 전달 */}
      <ActionGateRenderer
        gate={gate}
        signalType={effectiveSignal?.signalType}
      />
    </div>
  )
}
