'use client'

import { useEffect, useRef, useState } from 'react'

export function useRealtimePNL() {
  const [pnl, setPNL] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let alive = true

    fetch('/api/account/listenKey')
      .then((r) => r.json())
      .then(({ listenKey }) => {
        if (!alive || !listenKey) return

        const ws = new WebSocket(
          `wss://fstream.binance.com/ws/${listenKey}`
        )
        wsRef.current = ws

        ws.onmessage = (e) => {
          try {
            const d = JSON.parse(e.data)
            if (d.e === 'ACCOUNT_UPDATE') {
              const p = d.a.P.reduce(
                (s: number, p: any) => s + Number(p.up ?? 0),
                0
              )
              setPNL(p)
            }
          } catch {}
        }
      })
      .catch(() => {})

    return () => {
      alive = false
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [])

  return pnl
}
