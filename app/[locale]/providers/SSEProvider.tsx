'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'
import { sseManager } from '@/lib/realtime/sseConnectionManager'

type RealtimeMessage = any

const SSEContext =
  createContext<RealtimeMessage | null>(null)

/**
 * SSEProvider
 *
 * 역할:
 * - EventSource ❌
 * - 단일 SSE Manager에 와일드카드(*) 구독
 * - 가장 최근 이벤트 1건만 context로 제공
 */
export function SSEProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [message, setMessage] =
    useState<RealtimeMessage | null>(null)

  useEffect(() => {
    // ✅ 단일 SSE 매니저에 전체 이벤트 구독
    const unsubscribe = sseManager.subscribe(
      '*',
      (event) => {
        setMessage(event)
      },
    )

    return () => {
      unsubscribe()
    }
  }, [])

  return (
    <SSEContext.Provider value={message}>
      {children}
    </SSEContext.Provider>
  )
}

/**
 * useSSE
 *
 * - 전역 SSE 이벤트 1건 접근용
 * - (디버그 / 레거시 화면 전용)
 */
export function useSSE() {
  return useContext(SSEContext)
}
