'use client'

import { useEffect } from 'react'
import type { RealtimeEvent } from './eventTypes'
import { sseManager } from '@/lib/realtime/sseConnectionManager'

export function useRealtimeStream(
  onEvent?: (e: RealtimeEvent) => void,
) {
  useEffect(() => {
    // 🔒 alerts 페이지에서는 사용 금지
    if (location.pathname.includes('/alerts')) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[useRealtimeStream] disabled for alerts')
      }
      return
    }

    if (!onEvent) return

    // ✅ 단일 SSE 매니저에 "전체 이벤트" 구독
    const unsubscribe = sseManager.subscribe(
      '*',
      (event: RealtimeEvent) => {
        onEvent(event)
      },
    )

    return () => {
      unsubscribe()
    }
  }, [onEvent])
}
