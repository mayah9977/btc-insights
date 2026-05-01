// hooks/useVIP.ts
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

export type VIPStatus = {
  isVip: boolean
  level: 'FREE' | 'VIP'
}

type UseVIPOptions = {
  fast?: boolean
}

export function useVIP(options?: UseVIPOptions) {
  const fast = options?.fast ?? false

  const [data, setData] = useState<VIPStatus | null>(null)
  const [loading, setLoading] = useState(true)

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stoppedRef = useRef(false)

  const intervalTime = fast ? 3000 : 9000

  const fetchVIP = useCallback(async () => {
    if (stoppedRef.current) return

    try {
      const res = await fetch('/api/vip/status', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      })

      const json = (await res.json()) as VIPStatus

      setData(prev => {
        if (
          prev &&
          prev.isVip === json.isVip &&
          prev.level === json.level
        ) {
          return prev
        }

        return json
      })

      if (json.isVip) {
        stoppedRef.current = true
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    } catch {
      setData(prev => prev ?? { isVip: false, level: 'FREE' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true

    async function init() {
      if (!active || stoppedRef.current) return

      await fetchVIP()

      if (!active || stoppedRef.current) return

      intervalRef.current = setInterval(fetchVIP, intervalTime)
    }

    init()

    return () => {
      active = false

      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [fetchVIP, intervalTime])

  return {
    data,
    loading,
    refetch: fetchVIP,
  }
}
