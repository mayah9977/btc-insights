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
  const [sseStatus, setSseStatus] = useState<SSEStatus>('connecting')

  useEffect(() => {
    const unsubscribe = sseManager.subscribe('*', () => {
      setSseStatus('open')
    })

    return () => {
      unsubscribe()
      setSseStatus('connecting')
    }
  }, [])

  const { dropRate } = getStreamQuality()
  const isVIP = vipLevel === 'VIP'

  return (
    <>
      <VIP3GlowWrapper active={isVIP}>
        {/* 🔥 모바일에서는 완전 제거 */}
        <div className="hidden md:block">
          <AdvancedRealtimeHeader sseStatus={sseStatus} />

          {isVIP && (
            <VIP3MiniStats sse={sseStatus} dropRate={dropRate} />
          )}
        </div>
      </VIP3GlowWrapper>

      <VIP3GlowWrapper active={isVIP}>
        <MobileRealtimeHUD sseStatus={sseStatus} />
      </VIP3GlowWrapper>
    </>
  )
}
