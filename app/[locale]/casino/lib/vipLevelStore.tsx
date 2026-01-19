'use client'

import { useVIP } from '@/lib/vip/vipClient'
import type { VIPLevel } from './vipAccess'

/**
 * ⚠️ LEGACY BRIDGE
 * ------------------------------------
 * 기존 코드 호환용 헬퍼 훅
 * 실제 Context는 VIPProvider 단일 사용
 */
export function useVIPLevel(): {
  vipLevel: VIPLevel
  extremeForced: boolean
} {
  const { vipLevel } = useVIP()

  return {
    vipLevel,
    extremeForced: vipLevel === 'VIP3',
  }
}
