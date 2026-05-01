// components/VIPGate.tsx
'use client'

import type { ReactNode } from 'react'
import { useVIP } from '@/hooks/useVIP'

export default function VIPGate({
  children,
  fallback,
}: {
  children: ReactNode
  fallback: ReactNode
}) {
  const { data, loading } = useVIP()

  if (loading) {
    return (
      <div className="py-6 text-center text-sm text-slate-400">
        VIP 상태 확인 중...
      </div>
    )
  }

  if (!data || !data.isVip) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
