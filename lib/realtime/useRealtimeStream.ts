'use client'

import { useEffect } from 'react'
import type { RealtimeEvent } from './eventTypes'

export function useRealtimeStream(
  onEvent?: (e: RealtimeEvent) => void
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

    const es = new EventSource('/api/realtime/stream')

    es.onmessage = ev => {
      try {
        const data = JSON.parse(ev.data)
        onEvent(data)
      } catch {}
    }

    es.onerror = () => {
      es.close()
    }

    return () => {
      es.close()
    }
  }, [onEvent])
}
