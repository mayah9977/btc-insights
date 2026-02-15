'use client'

import { ReactNode } from 'react'
import { useRealtimeStream } from '@/lib/realtime/useRealtimeStream'

type Props = {
  children: ReactNode
}

export default function VIPRealtimeBoundary({ children }: Props) {
  // ✅ REALTIME SSE 단 1회 유지
  useRealtimeStream(() => {})

  return <>{children}</>
}
