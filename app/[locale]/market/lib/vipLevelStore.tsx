'use client'

import { useVIP } from '@/lib/vip/vipClient'
import type { VIPLevel } from '@/lib/vip/vipTypes'

export function useVIPLevel(): {
  vipLevel: VIPLevel
  extremeForced: boolean
} {
  const { vipLevel } = useVIP()

  return {
    vipLevel,
    extremeForced: vipLevel === 'VIP',
  }
}
