'use client'

import { useEffect } from 'react'
import type { VIPLevel } from './vipTypes'
import { subscribeVipLevel } from '@/lib/realtime/vipChannel'

/**
 * useVipSSE
 *
 * 역할:
 * - ❌ EventSource 생성 제거
 * - ✅ 단일 SSE Manager 기반 VIP_LEVEL 구독
 * - VIP 레벨 변경 시 setVIP 호출
 */
export function useVipSSE(
  userId: string,
  setVIP: (vip: VIPLevel) => void,
) {
  useEffect(() => {
    if (!userId) return

    const unsubscribe = subscribeVipLevel(
      (vipLevel) => {
        setVIP(vipLevel)
      },
    )

    return () => {
      unsubscribe()
    }
  }, [userId, setVIP])
}
