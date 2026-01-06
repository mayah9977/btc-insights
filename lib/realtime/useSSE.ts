'use client'

import { useEffect, useState } from 'react'

export function useSSE(
  url?: string,
  onData?: (data: any) => void
) {
  const [status, setStatus] = useState<
    'connecting' | 'open' | 'error'
  >('connecting')

  useEffect(() => {
    // 🔒 alertsStore가 SSE 단일 책임 → 여기서는 no-op
    if (!url) return

    // ⚠️ alerts 페이지에서는 사용 금지
    if (location.pathname.includes('/alerts')) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[useSSE] disabled in alerts context')
      }
      return
    }

    const es = new EventSource(url)

    es.onopen = () => setStatus('open')

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        onData?.(data)
      } catch {}
    }

    es.onerror = () => {
      setStatus('error')
      es.close()
    }

    return () => {
      es.close()
    }
  }, [url, onData])

  return { status }
}
