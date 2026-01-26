'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'

import type { VIPLevel } from './vipTypes'
import { VIPProvider } from './vipClient'

type Props = {
  initialLevel: VIPLevel
  children: ReactNode
}

/**
 * VIPRealtimeRoot
 *
 * - VIP Context Provider 전용
 * - ❌ 실시간 SSE / WS 로직 없음
 * - ❌ useVipRealtime import / 호출 금지
 *
 * 실시간 처리는 각 화면(ClientPage)에서
 * useVipRealtime()으로 직접 수행
 */
export default function VIPRealtimeRoot({
  initialLevel,
  children,
}: Props) {
  const [vipLevel, setVipLevel] =
    useState<VIPLevel>(initialLevel)

  return (
    <VIPProvider
      vipLevel={vipLevel}
      setVipLevel={setVipLevel}
    >
      {children}
    </VIPProvider>
  )
}
