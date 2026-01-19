'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import type { VIPLevel } from './vipTypes'
import { VIPProvider } from './vipClient'
import { useVipRealtime } from './useVipRealtime'

type Props = {
  initialLevel: VIPLevel
  children: ReactNode
}

export default function VIPRealtimeRoot({
  initialLevel,
  children,
}: Props) {
  const [vip, setVip] = useState<VIPLevel>(initialLevel)

  const userId = 'dev-user' // TODO: 실제 로그인 유저 ID

  // ✅ VIP 실시간 갱신 (단일 진입점)
  useVipRealtime(userId, setVip)

  return (
    <VIPProvider
      vipLevel={vip}
      setVipLevel={setVip}
    >
      {children}
    </VIPProvider>
  )
}
