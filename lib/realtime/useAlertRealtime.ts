'use client'

import { useEffect } from 'react'

/**
 * ⚠️ alertsStore.zustand.ts가 SSE 단일 책임
 * 이 hook은 alerts 컨텍스트에서는 완전 비활성화
 */
export function useAlertRealtime() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[useAlertRealtime] disabled. Use alertsStore SSE instead.'
      )
    }
  }, [])
}
