'use client'

import { useEffect } from 'react'
import { VIPLevel } from './vipTypes'

export function useVipSSE(
  userId: string,
  setVIP: (vip: VIPLevel) => void
) {
  useEffect(() => {
    if (!userId) {
      console.log('[VIP SSE] skipped (no userId)')
      return
    }

    const url = '/api/vip/sse'
    console.log('[VIP SSE] connecting to:', url, 'userId:', userId)

    const es = new EventSource(url)

    es.onopen = () => {
      console.log('[VIP SSE] connection opened')
    }

    es.onmessage = (event) => {
      console.log('[VIP SSE] raw message:', event.data)
      try {
        const data = JSON.parse(event.data)

        if (data.userId === userId) {
          console.log('[VIP SSE] VIP update:', data.vipLevel)
          setVIP(data.vipLevel as VIPLevel)
        }
      } catch (e) {
        console.warn('[VIP SSE] JSON parse error', e)
      }
    }

    es.onerror = (err) => {
      console.warn('[VIP SSE] error', err)
      es.close()
    }

    return () => {
      console.log('[VIP SSE] connection closed')
      es.close()
    }
  }, [userId, setVIP])
}
