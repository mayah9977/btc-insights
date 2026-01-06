'use client'

import { useSSE } from '@/lib/realtime/useSSE'
import { AdvancedRealtimeHeader } from '@/components/realtime/AdvancedRealtimeHeader'
import { MobileRealtimeHUD } from '@/components/realtime/MobileRealtimeHUD'
import { VIP3GlowWrapper } from '@/components/realtime/VIP3GlowWrapper'
import { VIP3MiniStats } from '@/components/realtime/VIP3MiniStats'
import { getStreamQuality } from '@/lib/realtime/streamQualityMonitor'

export function CasinoRealtimeUI({
  vipLevel,
}: {
  vipLevel: 'FREE' | 'VIP1' | 'VIP2' | 'VIP3'
}) {
  // ✅ SSE: stream 엔드포인트 단일 사용
  const { status: sseStatus } = useSSE(
    '/api/realtime/stream',
    (data) => {
      console.log('[SSE DATA]', data)
    }
  )

  const { dropRate } = getStreamQuality()

  return (
    <>
      {/* ===============================
        Realtime Header (Sticky, Global)
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
        Mobile HUD (Floating)
      ================================ */}
      <VIP3GlowWrapper active={vipLevel === 'VIP3'}>
        <MobileRealtimeHUD sseStatus={sseStatus} />
      </VIP3GlowWrapper>
    </>
  )
}
