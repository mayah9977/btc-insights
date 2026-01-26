'use client'

import { useEffect } from 'react'
import { sseManager } from '@/lib/realtime/sseConnectionManager'
import { SSE_EVENT } from '@/lib/realtime/types'

/**
 * useVip3SSE
 *
 * 역할:
 * - ❌ EventSource 직접 생성 제거
 * - ✅ 단일 SSE Manager 기반 VIP3 이벤트 구독
 * - VIP3 전용 데이터 전달
 */
export function useVip3SSE(
  userId: string,
  onData: (data: any) => void,
) {
  useEffect(() => {
    if (!userId) return

    const unsubscribe = sseManager.subscribe(
      SSE_EVENT.VIP3_EVENT ?? 'VIP3_EVENT',
      (data) => {
        onData(data)
      },
    )

    return () => {
      unsubscribe()
    }
  }, [userId, onData])
}
