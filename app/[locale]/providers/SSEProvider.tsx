'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type RealtimeMessage = any

const SSEContext = createContext<RealtimeMessage | null>(null)

export function SSEProvider({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState<RealtimeMessage | null>(null)

  useEffect(() => {
    const es = new EventSource('/api/realtime/stream')

    es.onmessage = (e) => {
      try {
        setMessage(JSON.parse(e.data))
      } catch {}
    }

    es.onerror = () => {
      es.close()
    }

    return () => es.close()
  }, [])

  return (
    <SSEContext.Provider value={message}>
      {children}
    </SSEContext.Provider>
  )
}

export function useSSE() {
  return useContext(SSEContext)
}
