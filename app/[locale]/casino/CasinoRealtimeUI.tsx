'use client'

import { useEffect, useState } from 'react'
import { AdvancedRealtimeHeader } from '@/components/realtime/AdvancedRealtimeHeader'
import { MobileRealtimeHUD } from '@/components/realtime/MobileRealtimeHUD'
import { VIP3GlowWrapper } from '@/components/realtime/VIP3GlowWrapper'
import { VIP3MiniStats } from '@/components/realtime/VIP3MiniStats'
import { getStreamQuality } from '@/lib/realtime/streamQualityMonitor'
import { useVIP } from '@/lib/vip/vipClient'
import { sseManager } from '@/lib/realtime/sseConnectionManager'

type SSEStatus = 'connecting' | 'open' | 'error'

export function CasinoRealtimeUI() {
  const { vipLevel } = useVIP()
  const [sseStatus, setSseStatus] =
    useState<SSEStatus>('connecting')

  // ✅ 단일 SSE 매니저 연결 상태 추적
  useEffect(() => {
    const unsubscribe = sseManager.subscribe(
      '*',
      () => {
        setSseStatus('open')
      },
    )

    return () => {
      unsubscribe()
      setSseStatus('connecting')
    }
  }, [])

  const { dropRate } = getStreamQuality()

  return (
    <>
      {/* ===============================
          Realtime Header
      ================================ */}
      <VIP3GlowWrapper active={vipLevel === 'VIP3'}>
        <AdvancedRealtimeHeader sseStatus={sseStatus} />

        {vipLevel === 'VIP3' && (
          <VIP3MiniStats
            sse={sseStatus}
            dropRate={dropRate}
          />
        )}
      </VIP3GlowWrapper>

      {/* ===============================
          Mobile HUD
      ================================ */}
      <VIP3GlowWrapper active={vipLevel === 'VIP3'}>
        <MobileRealtimeHUD sseStatus={sseStatus} />
      </VIP3GlowWrapper>
    </>
  )
}
