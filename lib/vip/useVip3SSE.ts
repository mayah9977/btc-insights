'use client'

import { useEffect } from 'react'

export function useVip3SSE(
  userId: string,
  onData: (data: any) => void
) {
  useEffect(() => {
    if (!userId) return

    const es = new EventSource(
      '/api/realtime/vip3',
      {
        withCredentials: true,
      }
    )

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onData(data)
      } catch (e) {
        console.warn(
          '[VIP3 SSE] JSON parse error',
          e
        )
      }
    }

    es.onerror = (err) => {
      console.warn('[VIP3 SSE] error', err)
      es.close()
    }

    return () => {
      es.close()
    }
  }, [userId, onData])
}
